# Stripe 連携仕様

本アプリにおける課金・サブスクリプション・プラン状態の扱いをまとめる。実装の一次情報は各 `app/api/stripe/*` と `lib/stripe/*` を参照する。

---

## 1. 目的とスコープ

- **目的:** 有料プラン（サブスクリプション）の購入、請求管理（Stripe Customer Portal）、アプリ内プラン表示（`profiles.plan`）の同期、アカウント削除時の **再請求防止**。
- **プランの真実:** アプリ側は `profiles.plan`（`free` | `paid`）を参照する。Stripe の状態は Webhook（および Checkout 成功直後の補助処理）で可能な限りこれに反映する。
- **Stripe Customer ID を DB に保持しない。** サブスクリプションは Stripe Search で `metadata.userId`（Supabase Auth のユーザー ID）によりユーザーと紐づける。

---

## 2. 環境変数

| 変数 | 用途 |
|------|------|
| `STRIPE_SECRET_KEY` | サーバーから Stripe API を呼ぶ。未設定時は Checkout / Portal / Webhook 署名検証以外の「Stripe 必須」処理は失敗またはスキップする（アカウント削除時の解約は **スキップ**）。 |
| `STRIPE_PRICE_ID` | Checkout の `line_items` に使う価格 ID（サブスクリプション用 Price）。 |
| `STRIPE_WEBHOOK_SECRET` | `POST /api/stripe/webhook` の `Stripe-Signature` 検証。 |
| `NEXT_PUBLIC_APP_URL` | Checkout / Portal のリダイレクト URL 組み立てのフォールバック（`Origin` ヘッダが無い場合など）。 |

`SUPABASE_SECRET_KEY`（または互換のサービスロールキー）は、Webhook およびダッシュボード上のプラン同期で `profiles` を更新するために別途必要（本仕様の Supabase 節は `docs/auth-spec.md` 等を参照）。

---

## 3. ユーザーとサブスクリプションの紐づけ

Checkout 作成時（`POST /api/stripe/checkout`）に次を設定する。

- `client_reference_id`: ログイン中ユーザーの ID
- `metadata.userId`（セッション）
- `subscription_data.metadata.userId`（サブスクリプション）

Webhook の `customer.subscription.*` では **サブスクリプションの `metadata.userId`** のみをユーザー ID として扱う。

**注意:** 上記メタデータが付かないサブスクリプション（手動作成・移行漏れ等）は、Search / Webhook のユーザー解決から外れる。ポータル開設やアカウント削除時の自動解約の対象にもならない。

---

## 4. API エンドポイント

いずれも `runtime = "nodejs"`。変更系は `isAllowedOrigin`（`lib/security/request.ts`）で Origin を検証する。

### 4.1 `POST /api/stripe/checkout`

- **認可:** `getAuthenticatedUser`（通常どおり論理削除済みはブロック）。
- **処理:** `mode: subscription` の Checkout Session を作成し、`{ url }` を返す。
- **エラー例:** `401 UNAUTHENTICATED`、`500 STRIPE_NOT_CONFIGURED`（`STRIPE_PRICE_ID` なし）。

### 4.2 `POST /api/stripe/portal`

- **認可:** `getAuthenticatedUser`。
- **処理:**
  1. `stripe.subscriptions.search` で `metadata['userId']:'<user.id>'` に一致するサブスクリプションを取得（最大 20 件・1 ページのみ）。
  2. ステータス優先順（`active` → `trialing` → `past_due` → …）で 1 件選び、その `customer` で Billing Portal Session を作成。
- **エラー例:** `502 STRIPE_SEARCH_FAILED`、`404 NO_SUBSCRIPTION`、`502 PORTAL_CREATE_FAILED`。
- **運用前提:** Stripe ダッシュボードで **Customer portal** を有効化していること。

### 4.3 `POST /api/stripe/webhook`

- **認証:** 生ボディ + `stripe-signature` + `STRIPE_WEBHOOK_SECRET` で `constructEvent`。
- **失敗時:** 署名不正は `400`、ハンドラ内エラーは `500`（Stripe が再送する想定）。

処理するイベントと `profiles.plan` 更新ルールは **§5** を参照。

### 4.4 アカウント削除との連携

`DELETE /api/account`（詳細は `docs/auth-spec.md`）実行時、`STRIPE_SECRET_KEY` がある場合は **Auth 削除の前に** `cancelStripeSubscriptionsForUser`（`lib/stripe/cancel-subscriptions-for-user.ts`）を呼ぶ。

- Search で `metadata['userId']` 一致のサブスクリプションを **全ページ** 取得。
- ステータスが `canceled` / `incomplete_expired` **以外**は `subscriptions.cancel`（**即時解約**）。
- 検索または解約が失敗した場合は **502** を返し、**Auth ユーザーは削除しない**。

---

## 5. Webhook と `profiles.plan`

共通ヘルパ `updateProfilePlanIfActive(userId, plan)` の前提:

1. `auth.admin.getUserById` で Auth ユーザーが存在しない → **何もしない**（削除済み想定）。
2. `profiles.deleted_at` が入っている → **何もしない**（論理削除ユーザー）。

それ以外は `profiles` を `{ id: userId, plan }` で upsert。

### 5.1 `checkout.session.completed`

- `resolveUserIdFromCheckoutSession` で userId を決定:
  - `session.metadata.userId` → `client_reference_id` →（必要なら）`subscription` を retrieve して `metadata.userId`
- userId が取れたら `updateProfilePlanIfActive(userId, "paid")`。

### 5.2 `customer.subscription.created` / `updated` / `deleted`

- `subscription.metadata.userId` を userId とする。無ければスキップ。
- 次の集合に `subscription.status` が含まれる場合 **`paid`**、それ以外 **`free`**:
  - `active`, `trialing`, `past_due`

**補足:** `unpaid` 等は `free` 側に倒れる。`paused` はこの集合に含めないため `free` 扱いになる（Stripe の仕様変更時はコードと本書を要確認）。

---

## 6. Checkout 成功直後の補助同期（ダッシュボード）

`GET /dashboard?billing=success&session_id=...` 時、サーバーで `syncPlanOnBillingSuccess`（`app/dashboard/page.tsx`）が動く場合がある。

- Checkout Session を `session_id` で取得し、`client_reference_id` が現在ユーザーと一致することを確認。
- 展開した `subscription` のステータスが `active` / `trialing` / `past_due` なら `profiles.plan` を `paid`、否则 `free` に upsert。

Webhook 到達が遅い・ローカルで Webhook 未設定のときの補助。**Webhook と二重に upsert しても整合は取れる。**

---

## 7. エラーコード（API 応答 `error.code` 抜粋）

| code | 発生箇所の例 |
|------|----------------|
| `STRIPE_NOT_CONFIGURED` | Checkout（`STRIPE_PRICE_ID` なし） |
| `STRIPE_SEARCH_FAILED` | Portal、**アカウント削除時の解約** |
| `NO_SUBSCRIPTION` | Portal（該当メタデータのサブスクなし） |
| `PORTAL_CREATE_FAILED` | Portal セッション作成失敗 |
| `STRIPE_CANCEL_FAILED` | アカウント削除時の `subscriptions.cancel` 失敗 |

---

## 8. ローカル検証

Stripe CLI で Webhook を転送する例（README と同様）:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

発行されたシークレットを `STRIPE_WEBHOOK_SECRET` に設定する。

---

## 9. 既知の限界・運用上の注意

- **DB に Stripe Customer ID を保存していない**ため、メタデータなしのサブスクリプションはアプリから特定できない。
- **Portal の Search は 1 ページ（20 件）のみ。** 同一ユーザーに極端に多数のサブスクリプションがある場合、意図しない customer が選ばれる理論的可能性がある。アカウント削除時の解約は **全ページ** 走査する。
- **即時解約**は Stripe の請求・未払いインボイス等のポリシーに従う。サブスク以外の請求残が完全にゼロになる保証は、Stripe 側の設定・状態に依存する。
- 本番では **Customer portal** の利用可能機能（解約・支払い方法など）を Stripe ダッシュボードで適切に設定すること。

---

## 10. 関連ファイル一覧

| 領域 | パス |
|------|------|
| Checkout | `app/api/stripe/checkout/route.ts` |
| Portal | `app/api/stripe/portal/route.ts` |
| Webhook | `app/api/stripe/webhook/route.ts` |
| Stripe クライアント | `lib/stripe/server.ts` |
| 削除時解約 | `lib/stripe/cancel-subscriptions-for-user.ts` |
| UI | `components/meals/upgrade-plan-button.tsx`, `manage-subscription-button.tsx` |
| 料金ページ | `app/billing/page.tsx` |
