# カロスナ

食事写真を AI で解析し、確認・修正してから 1 日のカロリーと PFC（たんぱく質・脂質・炭水化物）を記録する食事管理アプリです。

| 写真解析と確認 | ダッシュボード | 食事提案 |
| --- | --- | --- |
| ![食事写真の解析結果を確認して保存する画面](public/home-preview.webp) | ![摂取カロリーの推移と PFC を表示するダッシュボード](public/home-mobile-preview.webp) | ![過去の記録をもとに食事メニューを提案する画面](public/1.webp) |

## できること

- 食事写真からカロリーと PFC、料理ごとの内訳を推定する。画像は保存せず、解析時だけ扱う。
- 推定値は保存前に直せる。日時、合計、PFC、メモ、料理ごとの内訳を確認してから登録する。
- ダッシュボードで当日の合計と食事一覧を見る。有料プランでは過去日のカレンダーと直近 14 日の推移も見られる。
- メールとパスワード、または Google でログインする。
- Stripe のサブスクリプションで有料プランに切り替える。Webhook が `profiles.plan` を `free` / `paid` に更新する。
- 有料プランでは、手入力の食事登録、食事メニュー提案、今日のアドバイス、食事時間のプッシュ通知を使える。
- お問い合わせは Cloudflare Turnstile で検証してから保存する。

食事画像は Storage にも DB にも残さない。DB に残るのは、AI の推定結果とユーザーが直した食事データだけです。

## 技術構成

- Next.js（App Router）/ TypeScript
- Supabase Auth / Supabase PostgreSQL（RLS）
- Gemini API
- Stripe（Checkout、Customer Portal、Webhook）
- Cloudflare Turnstile
- Web Push / PWA
- Tailwind CSS
- Prisma は型生成と seed のみ。スキーマ変更は Supabase migration
- Biome、Vitest、GitHub Actions

## プラン

既定の上限です。`FREE_DAILY_ANALYSIS_LIMIT` と `PAID_DAILY_ANALYSIS_LIMIT` に正の整数を入れると上書きできます。1 日の区切りは日本時間です。

| | 無料 | 有料 |
| --- | --- | --- |
| AI 写真解析 | 1 日 1 回（標準モデル） | 1 日 3 回（高精度モデル） |
| 手入力の食事登録 | なし | あり |
| 食事メニュー提案 | なし | 1 日 3 回 |
| ダッシュボード | 当日 | 過去日、直近 14 日のグラフ |
| 今日のアドバイス、食事リマインダー | なし | あり |

有料プランの購入と解約は `/billing` から Stripe に渡します。`checkout.session.completed` と `customer.subscription.created` / `updated` / `deleted` を受け、契約状態が `active` / `trialing` / `past_due` のとき `profiles.plan` を `paid` に、それ以外は `free` にします。

## データ

スキーマの実体は [supabase/migrations](supabase/migrations) です。`pnpm run sb:start` でローカル DB に順に適用されます。

主なテーブル:

- `profiles` … プラン、目標カロリー、論理削除
- `meals` / `meal_items` … 食事と料理ごとの内訳
- `ai_analysis_logs` … 解析の成否とモデル
- `meal_suggestion_logs` … 食事提案の利用回数
- `meal_reminder_settings` / `meal_reminder_logs` … 通知時刻と送信履歴
- `push_subscriptions` … Web Push の購読
- `contact_messages` … お問い合わせ

RLS は有効で、ユーザーは自分の行だけを参照・更新できます。プラン更新などサーバー権限が必要な処理は `SUPABASE_SECRET_KEY` を使います。

## 必要な環境変数

プロジェクト直下の `.env` に置きます。`.env*` は Git に含まれません。

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<supabase-anon-key>"
SUPABASE_SECRET_KEY="<supabase-secret-key>"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

GEMINI_API_KEY="<gemini-api-key>"
GEMINI_FREE_MODEL="gemini-2.5-flash-lite"
GEMINI_PAID_MODEL="gemini-2.5-flash"
FREE_DAILY_ANALYSIS_LIMIT="1"
PAID_DAILY_ANALYSIS_LIMIT="3"

STRIPE_SECRET_KEY="<stripe-secret-key>"
STRIPE_PRICE_ID="<stripe-price-id>"
STRIPE_WEBHOOK_SECRET="<stripe-webhook-secret>"

NEXT_PUBLIC_TURNSTILE_SITE_KEY="<cloudflare-turnstile-site-key>"
TURNSTILE_SECRET_KEY="<cloudflare-turnstile-secret-key>"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="<vapid-public-key>"
VAPID_PRIVATE_KEY="<vapid-private-key>"
VAPID_SUBJECT="mailto:<contact-email>"
CRON_SECRET="<cron-secret>"

LEGAL_SELLER_NAME="<販売事業者名>"
LEGAL_REPRESENTATIVE_NAME="<運営責任者名>"
LEGAL_BUSINESS_ADDRESS="<事業者所在地>"
LEGAL_BUSINESS_PHONE="<電話番号>"
LEGAL_CONTACT_EMAIL="<問い合わせメールアドレス>"
```

`GEMINI_FREE_MODEL` の未設定時は `gemini-2.5-flash-lite`、`GEMINI_PAID_MODEL` の未設定時は `gemini-2.5-flash` です。`GEMINI_MODEL` を置くと、個別設定がないプランのフォールバックになります。`SUPABASE_SERVICE_ROLE_KEY` も読めますが、`SUPABASE_SECRET_KEY` を使ってください。

### Cloudflare Turnstile

サイトキーとシークレットは Cloudflare の Turnstile で別々に発行します。同じ文字列を入れるとチャレンジが失敗します。

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` … フロントに出す公開キー
- `TURNSTILE_SECRET_KEY` … Siteverify 用の秘密キー

ローカルで未設定のときは、Cloudflare のテストキーを使います。

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

### 特定商取引法に基づく表記

`/commerce-disclosure` は `LEGAL_*` を表示します。決済審査では、所在地・電話番号・メールアドレスがページ上で確認できることを求められることがあります。

### Google ログイン

ローカルでは、`supabase start` が読むプロジェクト直下の `.env` に次を追加します。

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="<google-oauth-client-id>"
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="<google-oauth-client-secret>"
```

Google Cloud の承認済みリダイレクト URI に `http://127.0.0.1:54321/auth/v1/callback` を登録し、値を変えたら `pnpm run sb:stop` のあと `pnpm run sb:start` します。

Supabase Cloud では Authentication → Providers → Google を有効化し、リダイレクト URI に `https://<project-ref>.supabase.co/auth/v1/callback` を登録します。

## セットアップ

```bash
pnpm install
pnpm run sb:start
pnpm dev
```

ブラウザで http://localhost:3000 を開きます。

ローカルの待ち受け:

- アプリ: http://localhost:3000
- Supabase API: http://127.0.0.1:54321
- Supabase Studio: http://127.0.0.1:54323
- Mailpit: http://127.0.0.1:54324
- Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

確認メールは Mailpit で見られます。スキーマ変更は `prisma db push` を使わず、次で migration を作ります。

```bash
pnpm run db:migrate:new -- <migration_name>
pnpm run db:migrate:push
```

Prisma は `pnpm run db:types`（`prisma generate`）と `pnpm run db:seed` だけを使います。

Stripe の Webhook をローカルへ転送する場合:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

表示された `whsec_...` を `STRIPE_WEBHOOK_SECRET` に入れます。

## 操作

1. `/signup` または `/login` でメール、もしくは Google で入る。
2. `/meals/new` で画像を選び、解析する。未選択、画像以外、5MB 超過、未ログイン、解析失敗、回数上限でエラーになる。
3. 推定値を直して登録する。`meals` と `meal_items` に保存される。
4. `/dashboard` で当日のカロリーと PFC を確認する。
5. `/billing` から有料プランを購入する。Webhook がプランを更新する。
6. 有料プランでは `/suggestions` の食事提案と、`/meal-reminders` の通知設定が使える。

## API

- `POST /api/meals/analyze` … 画像を Gemini に渡し、Zod で検証する。成功時だけ解析回数を消費する。
- `POST /api/meals` / `PATCH /api/meals/[mealId]` … 確認後の食事を保存・更新する。
- `POST /api/meal-suggestions` … 有料プラン向けの食事提案。
- `POST /api/daily-advice` … 当日の記録に対するアドバイス。
- `POST /api/stripe/checkout` / `POST /api/stripe/portal` / `POST /api/stripe/webhook` … 購入、請求管理、プラン同期。
- `POST /api/contact` … Turnstile を検証し、`contact_messages` に保存する。
- `POST /api/cron/meal-reminders` … `Authorization: Bearer <CRON_SECRET>` で食事リマインダーを送る。

## 検証

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
