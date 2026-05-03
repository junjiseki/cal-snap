# 認証周り仕様書（カロスナ）

本ドキュメントはリポジトリ現状の実装に基づく。**Supabase Auth** を唯一の認証基盤とし、Next.js App Router（`@supabase/ssr`）で Cookie ベースのセッションを扱う。

---

## 1. 概要

| 項目 | 内容 |
|------|------|
| 認証プロバイダ | Supabase Auth（ホスト型またはローカル CLI） |
| アプリ側セッション | Supabase が発行する JWT / リフレッシュトークンを **HTTP-only Cookie** 相当で管理（SSR クライアント経由） |
| ユーザーストレージ | `auth.users`（Supabase 管理）、アプリデータは `public.profiles` などと `auth.users.id` で紐づく |
| 主なログイン手段 | メール＋パスワード、Google OAuth |

---

## 2. 環境変数（認証関連）

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ブラウザ・サーバー双方の匿名クライアント（RLS 適用） |
| `SUPABASE_SECRET_KEY` | サーバー専用（推奨名）。`SUPABASE_SERVICE_ROLE_KEY` も後方互換で可。**アカウント削除（Auth Admin）** 等で使用 |
| `NEXT_PUBLIC_APP_URL` | サイトの公開オリジン。OAuth リダイレクト・Origin 検証・メタデータ等で参照 |

---

## 3. 認証フロー

### 3.1 メール＋パスワード（新規登録）

1. ユーザーが `/signup` で `signUp`（`components/meals/signup-form.tsx`）。
2. Supabase 設定により **メール確認必須** の場合、確認メールのリンクから `/auth/confirm` へ遷移。
3. `exchangeCodeForSession` または `verifyOtp` でセッション確立後、`nextResponseAfterSession`（後述）を経て `next` へリダイレクト。

### 3.2 メール＋パスワード（ログイン）

1. `/login` で `signInWithPassword`（`components/meals/login-form.tsx`）。
2. 成功後、**同一クライアント**で `profiles.deleted_at` を参照。利用停止（論理削除のみ残っているレガシーアカウント等）なら `signOut` し、画面上にエラー。
3. 問題なければ `next`（既定 `/dashboard`）へ遷移。

**ログイン失敗時のメッセージ**は英語の生エラーを出さず、`lib/auth/sign-in-errors.ts` の `mapSupabaseSignInError` で日本語にマッピング（未確認メール・誤パスワード等）。

### 3.3 Google OAuth

1. `/login` または `/signup` で `signInWithOAuth`、コールバックは **`/auth/callback`**（`app/auth/callback/route.ts`）。
2. `code` を `exchangeCodeForSession` でセッション化。
3. 成功時は `nextResponseAfterSession` 後、`next` へリダイレクト。失敗時は `/login?next=...` へ。

### 3.4 メール確認（マジックリンク / PKCE code）

- **`/auth/confirm`**（`app/auth/confirm/route.ts`）  
  - クエリ `code` → `exchangeCodeForSession`  
  - または `token_hash` + `type` → `verifyOtp`  
- 成功後も `nextResponseAfterSession` を実行。  
- 失敗時は `/login?error=auth_confirm`（ログイン画面で案内表示）。

---

## 4. セッション確立後の共通処理

### 4.1 `nextResponseAfterSession`（`lib/auth/post-login-redirect.ts`）

セッションが付いた直後に実行する。

1. `getUser` でユーザー取得。
2. `profiles` の **`deleted_at`** 取得で **`maybeSingle()` の error** がある場合はログ出力のうえ **`signOut`** し、**`/login?error=profile_fetch&next=...`** へ（取得失敗時は inactive 判定をスキップしない）。
3. `deleted_at` が非 null なら **利用停止** とみなし、`signOut` したうえで **`/login?inactive=1&next=...`** へリダイレクト。
4. それ以外は **`next`**（相対パス）へリダイレクト。

**利用箇所:** `app/auth/callback/route.ts`、`app/auth/confirm/route.ts`

### 4.2 `getAuthenticatedUser`（`lib/supabase/server.ts`）

サーバー側で「ログイン済みか」を判定する際に使用。

1. `getUser`（JWT 検証）。
2. **Stale refresh token** 系エラーなら `signOut` し `user: null`（`lib/supabase/stale-session.ts`）。
3. ユーザーありの場合、`profiles.deleted_at` を参照。**利用停止**なら `signOut` し `user: null`。

ページ・Route Handler・Server Component では原則これ経由でユーザーを取得する。

---

## 5. リダイレクトとオープンリダイレクト対策

- クエリ `next` は **`safeInternalPath`**（`lib/auth/safe-redirect.ts`）で検証。
- **同一オリジン内の相対パスのみ**許可（`/` 始まり、`//` や `://`、バックスラッシュ、NUL 等を拒否）。
- 不正時はフォールバックパス（例: `/dashboard`）を使用。

---

## 6. ログイン画面のクエリパラメータ

| パラメータ | 意味 |
|------------|------|
| `next` | ログイン成功後の遷移先（内部パスのみ） |
| `deleted=1` | アカウント削除直後。再登録可能である旨の案内 |
| `inactive=1` | 利用停止アカウントで OAuth/確認フローから弾かれた場合 |
| `error=auth_confirm` | メール確認リンク無効・期限切れ等 |
| `error=profile_fetch` | セッション直後の `profiles.deleted_at` 取得失敗（`signOut` 済み・再試行を促す） |

---

## 7. アカウント削除（退会）

- **エンドポイント:** `DELETE /api/account`（`app/api/account/route.ts`）
- **前提:** `isAllowedOrigin`（`lib/security/request.ts`）で変更系リクエストの Origin を検証。
- **認可:** `getAuthSessionUser`（`lib/supabase/server.ts`）でセッションを解決する。`profiles.deleted_at` による強制 signOut は**行わない**。論理削除のみ残るレガシーアカウントでも、パスワードログイン直後のセッションで本 API を呼べる。
- **処理:** `STRIPE_SECRET_KEY` がある場合は先に `cancelStripeSubscriptionsForUser`（`lib/stripe/cancel-subscriptions-for-user.ts`）で `metadata.userId` 一致サブスクを即時解約。その後 `auth.admin.deleteUser(userId)` で **Auth ユーザーを削除**。Stripe 連携が無効な環境では解約処理はスキップ。
- **データ:** DB の FK（`ON DELETE CASCADE`）により、`profiles`・`meals` 等のユーザー紐づけデータは削除される（`contact_messages.user_id` は `SET NULL` 等、マイグレーション定義に従う）。
- **メール再利用:** Auth 上のユーザーが消えるため、**同一メールアドレスで再登録可能**。
- Stripe 解約に失敗した場合は **Auth 削除は行わず** 502 を返す。設定・料金画面・確認ダイアログで案内。

---

## 8. パスワード変更

- **画面:** `/settings` →「パスワード」（`components/account/change-password-form.tsx`）
- **表示条件:** `user.identities` に **`provider === "email"`** があり、かつ `user.email` がある場合のみフォーム表示。Google のみ等は説明文のみ。
- **流れ:** 現在のパスワードで `signInWithPassword` による検証 → `updateUser({ password })`。

本番で Supabase の **Secure password change** を有効にした場合は、追加の `reauthenticate` 要件が発生し得る。ローカル `supabase/config.toml` では `secure_password_change = false`。

---

## 9. ミドルウェア（`proxy.ts`）

- 全リクエストで Supabase `getUser` を実行し、**古いリフレッシュトークン**なら `signOut`。
- セキュリティヘッダ（`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` 等）を付与。

---

## 10. API の CSRF 対策（Origin 検証）

変更系 HTTP メソッド（`POST` / `PUT` / `PATCH` / `DELETE`）では `isAllowedOrigin` を通す。

- **`Origin` ヘッダ**があればそれを実オリジンとして使用。
- なければ **`Referer`** からオリジンを復元。
- 期待オリジンは **`NEXT_PUBLIC_APP_URL`** の origin、未設定時は `Host` / `X-Forwarded-Host` + `X-Forwarded-Proto` から構築。

一致しなければ **403**（`FORBIDDEN_ORIGIN`）。テストは `tests/security/request.test.ts` を参照。

---

## 11. データベースと RLS（認証の補足）

- `profiles.id` は `auth.users.id` と一致。**新規ユーザー**はトリガーで `profiles` 行が作成される（マイグレーション参照）。
- 過去の **論理削除**（`profiles.deleted_at` のみ設定）と **Auth 削除** が混在し得る：
  - **現行の退会 API** は Auth 削除が主。
  - **`deleted_at` のみ**残るレガシーは、メール＋パスワードでログインした直後に `DELETE /api/account` を呼び出して Auth ユーザーを削除し、**メールを再利用**できる（`components/meals/login-form.tsx`）。
  - **`deleted_at` のみ**残るレガシー行は、`getAuthenticatedUser` / `nextResponseAfterSession` で通常ログインを拒否する用途にまだ参照される。

---

## 12. 関連ファイル一覧（参照用）

| 種別 | パス |
|------|------|
| サーバークライアント | `lib/supabase/server.ts` |
| ブラウザクライアント | `lib/supabase/client.ts` |
| Admin クライアント | `lib/supabase/admin.ts` |
| OAuth コールバック | `app/auth/callback/route.ts` |
| メール確認 | `app/auth/confirm/route.ts` |
| ログイン UI | `app/login/page.tsx`, `components/meals/login-form.tsx` |
| 新規登録 UI | `app/signup/page.tsx`, `components/meals/signup-form.tsx` |
| ログインエラー文言 | `lib/auth/sign-in-errors.ts` |
| セッション後リダイレクト | `lib/auth/post-login-redirect.ts` |
| 安全な next | `lib/auth/safe-redirect.ts` |
| アカウント削除 API | `app/api/account/route.ts` |
| パスワード変更 | `components/account/change-password-form.tsx`, `app/settings/page.tsx` |
| Origin 検証 | `lib/security/request.ts` |
| 退会確認文言 | `lib/account-delete.ts` |

---

## 13. 改定時の注意

- Supabase ダッシュボードの **Auth 設定**（メール確認必須、パスワードポリシー、OAuth リダイレクト URL）と本仕様の前提がずれると、本番のみ再現する不整合が起きる。
- 本ドキュメントはコードと二重管理になるため、**認証フローを変えたら本ファイルを更新する**こと。
