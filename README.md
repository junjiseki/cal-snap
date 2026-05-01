# カロリースナップ AI

食事写真から AI が総カロリーと PFC を推定し、ユーザーが確認・修正してから食事として登録する MVP です。

## 技術構成

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Tailwind CSS
- Gemini API

画像は Storage や DB に保存しません。フロントで選択した画像を API Route に送信し、API 内で一時的に base64 化して Gemini Flash に渡します。DB には AI 解析結果とユーザー修正後の食事データのみ保存します。

## DB スキーマ

Supabase migration:

- [supabase/migrations/202604300001_ai_meal_mvp.sql](/Users/jun/Desktop/my/cal-snap/supabase/migrations/202604300001_ai_meal_mvp.sql)
- [supabase/migrations/20260430195000_add_daily_calorie_goal_to_profiles.sql](/Users/jun/Desktop/my/cal-snap/supabase/migrations/20260430195000_add_daily_calorie_goal_to_profiles.sql)
- [supabase/migrations/20260501061000_fix_atomic_meal_workflows.sql](/Users/jun/Desktop/my/cal-snap/supabase/migrations/20260501061000_fix_atomic_meal_workflows.sql)
- [supabase/migrations/20260501072000_create_contact_messages.sql](/Users/jun/Desktop/my/cal-snap/supabase/migrations/20260501072000_create_contact_messages.sql)

主なテーブル:

- `profiles`
  - `id`
  - `plan`: `free | paid`
  - `created_at`
- `meals`
  - `id`
  - `user_id`
  - `eaten_at`
  - `total_calories`
  - `protein`
  - `fat`
  - `carbs`
  - `ai_confidence`
  - `memo`
  - `created_at`
- `meal_items`
  - `id`
  - `meal_id`
  - `name`
  - `estimated_amount`
  - `calories`
  - `protein`
  - `fat`
  - `carbs`
  - `confidence`
- `ai_analysis_logs`
  - `id`
  - `user_id`
  - `analyzed_at`
  - `model`
  - `success`
- `contact_messages`
  - `id`
  - `user_id`
  - `name`
  - `email`
  - `category`
  - `message`
  - `status`
  - `created_at`

RLS は有効化済みで、自分のデータだけ参照・更新できます。

## 必要な環境変数

`.env` に設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<supabase-anon-key>"
GEMINI_API_KEY="<gemini-api-key>"
GEMINI_MODEL="gemini-2.5-flash"
FREE_DAILY_ANALYSIS_LIMIT="1"
PAID_DAILY_ANALYSIS_LIMIT="3"
STRIPE_SECRET_KEY="<stripe-secret-key>"
STRIPE_PRICE_ID="<stripe-price-id>"
STRIPE_WEBHOOK_SECRET="<stripe-webhook-secret>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SUPABASE_SECRET_KEY="<supabase-secret-key>"
```

`GEMINI_MODEL` は未設定の場合 `gemini-2.5-flash` を使用します。

### ローカル Supabase で Google ログインを使う場合

`supabase start` が読み込む **プロジェクトルートの `.env`**（`.env.local` だけでは足りないことがあります）に、次を追加してください。

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="<google-oauth-client-id>"
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="<google-oauth-client-secret>"
```

- Google Cloud Console の OAuth クライアント（ウェブ）の **承認済みリダイレクト URI** に  
  `http://127.0.0.1:54321/auth/v1/callback` を登録します。  
- 値を変えたら **`pnpm run sb:stop` → `pnpm run sb:start`** で Auth を再起動します。

### Supabase Cloud で Google ログインを使う場合

ダッシュボードの **Authentication → Providers → Google** で有効化し、Client ID / Secret を設定します。  
Google 側のリダイレクト URI には次を登録します（`<project-ref>` はご自身のプロジェクト）。

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

「`Unsupported provider: provider is not enabled`」は、**上記が未設定または Google が OFF** のときに返ります。

「`Unsupported provider: missing redirect URI`」は多くの場合、**ローカルで `[auth.external.google].redirect_uri` が空**、または **Google Cloud の「承認済みリダイレクト URI」に Supabase のコールバックが無い**ときです。ローカルでは `supabase/config.toml` で `http://127.0.0.1:54321/auth/v1/callback` を明示済みです。**`pnpm run sb:stop` → `pnpm run sb:start`** で反映し、Google 側にも同じ URI を登録してください。Cloud 利用時はダッシュボード **Authentication → Providers → Google** に表示されるコールバック URL（`https://<project-ref>.supabase.co/auth/v1/callback`）を Google に登録します。

Stripe を使う場合は、Webhook エンドポイントを `POST /api/stripe/webhook` に設定してください。  
また、`profiles.plan` と AI 解析ログの更新はサーバー権限で行うため `SUPABASE_SECRET_KEY` が必要です。  
（互換のため `SUPABASE_SERVICE_ROLE_KEY` も読めますが、非推奨です）

## セットアップ

依存関係をインストールします。

```bash
pnpm install
```

ローカル Supabase を起動します。

```bash
pnpm run sb:start
pnpm run sb:status
```

### ローカルサーバー一覧（開発時）

- アプリ: `http://localhost:3000`
- Supabase API: `http://127.0.0.1:54321`
- Supabase Studio: `http://127.0.0.1:54323`
- ローカルメールサーバー（Mailpit）: `http://127.0.0.1:54324`
- ローカル Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Supabase Studio:

- `http://127.0.0.1:54323`

メールリンクログインや新規登録確認メールは Mailpit で確認できます。

Supabase SQL Editor または migration SQL でスキーマを適用します。

```txt
supabase/migrations/202604300001_ai_meal_mvp.sql
supabase/migrations/20260430195000_add_daily_calorie_goal_to_profiles.sql
supabase/migrations/20260501061000_fix_atomic_meal_workflows.sql
supabase/migrations/20260501072000_create_contact_messages.sql
```

Supabase 構成では `prisma db push` は使用しません。スキーマ変更は migration SQL を適用し、Prisma は `prisma generate` と `prisma db seed` のみ実行してください。

マイグレーション運用コマンド:

```bash
pnpm run db:migrate:new -- <migration_name>
pnpm run db:migrate:push
```

開発サーバーを起動します。

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 操作方法

### 1. ログイン

`/login` では次の2つの方法でログインできます。

- メール + パスワードログイン
- Google OAuth ログイン
- メール + パスワードで新規登録（確認メール経由）

Supabase 側では Email Auth を有効化し、Google ログインは上記「Google ログイン（ローカル / Cloud）」を設定してください。

### 2. 食事写真をAI解析

`/meals/new` で画像を選択し、「AI解析」を押します。

エラーハンドリング:

- 画像未選択
- 画像以外のファイル
- 5MB 超過
- 未ログイン
- AI 解析失敗
- 解析回数上限超過

解析回数制限:

- 無料プラン: 1日1回
- 有料プラン: 1日3回

課金状態は `profiles.plan` で判定します。Stripe 連携は未実装で、MVP では DB の `profiles.plan` を `free` / `paid` に更新してモックします。

### 3. AI 推定結果を確認・修正

AI の推定結果はすぐには DB 保存されません。画面上の確認フォームで以下を修正できます。

- 食事日時
- 総カロリー
- PFC
- メモ
- 料理ごとの内訳

「登録」を押すと、修正後の値が `meals` と `meal_items` に保存されます。

### 4. 今日の合計を見る

`/dashboard` で今日の合計を表示します。

- 今日の総摂取カロリー
- PFC 合計
- 食事一覧
- 料理ごとの内訳

## API Routes

- `POST /api/meals/analyze`
  - multipart form data の `image` を受け取る
  - Gemini Flash に画像を渡す
  - Zod で JSON 形式のレスポンスを検証
  - 成功時のみ `ai_analysis_logs.success = true`

- `POST /api/meals`
  - ユーザー修正後の JSON を受け取る
  - `meals` と `meal_items` に保存

- `POST /api/contact`
  - お問い合わせフォームの JSON を受け取る
  - Zod で入力値を検証
  - `contact_messages` に保存

## 動作確認手順

1. Supabase で migration SQL を実行する
2. `.env` を設定する
3. `pnpm dev` を起動する
4. `/login` からログインする
5. `/meals/new` で画像を選択して AI 解析する
6. 推定値を修正して登録する
7. `/dashboard` で合計カロリーと PFC を確認する
8. 無料プランのまま同日に2回目の解析を実行し、上限エラーを確認する
9. Supabase SQL Editor で `profiles.plan = 'paid'` に変更し、1日3回まで解析できることを確認する

## 他開発者向けメモ

- `main` 取り込み後は `pnpm install` と `pnpm run sb:start` を先に実行する
- DB 変更時は `pnpm run db:migrate:new -- <name>` で SQL を作成し、`pnpm run db:migrate:push` で適用する
- Prisma は `pnpm run db:types` と `pnpm run db:seed` のみ利用し、`prisma db push` は実行しない
- Auth メール確認が必要なテストは Mailpit（`http://127.0.0.1:54324`）で行う
- 環境変数は `.env.local` を使用し、秘密情報はコミットしない

## 検証コマンド

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm run db:types
pnpm run db:seed
pnpm run db:migrate:new -- add_example_change
pnpm run db:migrate:push
```

## TODO

- TODO: Stripe Webhook と連携して `profiles.plan` を自動更新する
- TODO: 解析回数制限の同時実行テストを追加する
- TODO: ユーザーのタイムゾーン設定を `profiles` に持たせる
- TODO: AI 解析失敗時のリトライ UI を追加する
- TODO: Supabase CLI を導入して migration 適用をコマンド化する
# cal-snap
