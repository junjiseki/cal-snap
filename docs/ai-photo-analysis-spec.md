# AI 写真解析（食事栄養推定）仕様

食事写真を Google Gemini に渡し、PFC・カロリー・品目を推定する機能の仕様。実装の一次情報は `app/api/meals/analyze/route.ts`、`lib/meal-analysis.ts`、`components/meals/meal-photo-analyzer.tsx` および Supabase の `ai_analysis_logs` / `claim_ai_analysis_slot` を参照する。

---

## 1. 目的とスコープ

- **目的:** ユーザーがアップロードした食事画像から、料理単位の栄養値と全体サマリを推定し、確認・編集のうえで食事として保存できるようにする。
- **対象 API:** `GET/POST /api/meals/analyze`（解析と利用枠照会）、`POST /api/meals`（解析結果または手入力の登録）。
- **対象外:** 画像を使わない**手動入力のみ**の食事登録は Gemini を呼ばない（同一フォームから `POST /api/meals` のみ）。

---

## 2. 環境変数

| 変数 | 用途 |
|------|------|
| `GEMINI_API_KEY` | `@google/genai`（`GoogleGenAI`）の API キー。未設定時は `POST /api/meals/analyze` が `500 GEMINI_NOT_CONFIGURED`。 |
| `GEMINI_MODEL` | 生成モデル ID。未設定時は `gemini-3-flash-preview`。 |
| `FREE_DAILY_ANALYSIS_LIMIT` | 無料プランの **1 ユーザーあたり 1 日の解析試行上限**（正の整数以外・未設定時はデフォルト `1`）。 |
| `PAID_DAILY_ANALYSIS_LIMIT` | 有料プランの同上（デフォルト `3`）。 |
| `SUPABASE_SECRET_KEY` | 解析成功時の `ai_analysis_logs` 更新・失敗時の削除など、サービスロールでの操作に使用。未設定時は `500 SUPABASE_ADMIN_NOT_CONFIGURED`。 |

`profiles.plan`（`free` | `paid`）は上限算出に使う。Stripe 連携は `docs/stripe-spec.md` を参照。

---

## 3. 日付・タイムゾーン

- **「今日」の区間**は **日本（`Asia/Tokyo`）の暦**で `00:00:00.000`〜`23:59:59.999` を ISO タイムスタンプに変換した範囲（`getTodayRangeInJapan` / `getDayRangeInJapan`）。
- 解析回数の集計・枠確保 RPC に渡す `p_day_start` / `p_day_end` はこの範囲に合わせる。

---

## 4. 画像入力の制約（サーバー）

| 項目 | 仕様 |
|------|------|
| 形式（MIME） | `image/jpeg`, `image/png`, `image/webp` |
| 最大サイズ | `MAX_IMAGE_BYTES` = 5 MiB（`lib/meal-analysis.ts`） |
| 実体検証 | 宣言 MIME と先頭バイト（マジックナンバー）が一致すること（JPEG / PNG / WebP）。不一致は `400 INVALID_IMAGE`（枠を確保済みなら解放してから返す）。 |
| 転送 | `multipart/form-data`、フィールド名 `image`（`File`）。 |

---

## 5. AI 呼び出し（Gemini）

- **SDK:** `@google/genai` の `GoogleGenAI`。
- **入力:** インライン画像（base64）＋テキスト指示。モデルは `GEMINI_MODEL`。
- **設定（概要）:**
  - `temperature: 0.2`
  - `responseMimeType: "application/json"`
  - `responseJsonSchema`: サーバー側で定義した JSON Schema（`MealAnalysisSchema` と整合するフラットな object／`additionalProperties: false`）
- **プロンプト（要旨）:** 食事写真から栄養を推定し、**JSON のみ**返す。不確かさは confidence に反映。日本語アプリ向けに推定量・単位を扱いやすく、など（英日混在の固定文がコードに記述されている）。
- **後処理:** `MealAnalysisSchema`（Zod）でパース後、カロリー・PFC は `toInteger`、信頼度は `toConfidence`（0〜1、小数 2 桁程度にクランプ）で正規化。

### 5.1 出力スキーマ（論理モデル）

Zod 定義（`lib/meal-analysis.ts`）の要点:

- **食事全体:** `total_calories`, `protein`, `fat`, `carbs`, `ai_confidence`, `memo`（最大 1000 文字）, `items`（1〜30 件）
- **各品目:** `name`, `estimated_amount`（各最大 80 文字）, `calories`, `protein`, `fat`, `carbs`, `confidence`
- 数値上限: 栄養系は `0`〜`100_000`、`confidence` / `ai_confidence` は `0`〜`1`

登録 API では `MealRegistrationSchema` = 上記に `eaten_at`（ISO datetime 文字列）を加えたものを使用する。

---

## 6. 1 日あたりの解析上限と原子性

### 6.1 表示用（`GET /api/meals/analyze`）

- ログイン必須。
- `profiles.plan` を取得（行が無ければ `profiles` に `free` で insert を試みる）。
- 当日（日本日付）の `ai_analysis_logs` のうち **`success = true` の件数**を数え、プランに応じた上限との差を `usage` として返す。

### 6.2 解析時（`POST /api/meals/analyze`）

1. Origin 検証（`isAllowedOrigin`）、認証。
2. 画像検証（形式・サイズ・マジックナンバーは §4）。
3. プランと **成功分のみ**の件数による事前チェック（`usage.used >= usage.limit` なら `429`）。※最終判定は RPC。
4. **`claim_ai_analysis_slot`（Supabase RPC）** で枠を確保:
   - 呼び出しユーザーと `p_user_id` の一致、`profiles.deleted_at is null`（論理削除済みは不可）を検証。
   - **トランザクション内**で `pg_advisory_xact_lock` によりユーザー×日単位で直列化。
   - 当日範囲内の **`success = false` かつ 15 分以上前**のログを削除（スタックした失敗枠の掃除）。
   - 当日範囲内の **全ログ件数**（成功・未完了を問わない）が `p_daily_limit` 以上なら **行を挿入せず空結果**を返す。
   - それ以外なら `success = false` の行を 1 件 insert し、`log_id` と `used`（挿入後の当日カウント）、`daily_limit` を返す。
5. 画像読み込み失敗やマジック不一致時は、該当 `log_id` の行をサービスロールで **delete**（枠解放）。
6. Gemini 成功後、同 `log_id` を **`success: true` に update**。
7. Gemini 失敗・パース失敗時は該当行を **delete** し、`502 AI_ANALYSIS_FAILED`。

**注意:** `GET` の `remaining` は成功回数ベース、`claim` の枠は **当日のログ総数**ベース。解析処理中は `success = false` の行が残るため、理論上「残り 1」と表示されていても同時リクエストで枠が埋まる場合がある（意図した競合制御）。

---

## 7. API 一覧

### 7.1 `GET /api/meals/analyze`

- **認可:** ログイン必須（`getAuthenticatedUser`）。
- **レスポンス例:** `{ plan, usage: { used, limit, remaining } }`
- **エラー:** `401 UNAUTHENTICATED`, `500 USAGE_FETCH_FAILED`

### 7.2 `POST /api/meals/analyze`

- **認可:** ログイン必須、**Origin 必須**（変更系）。
- **ボディ:** `multipart/form-data`、`image` に画像ファイル。
- **成功時:** `{ analysis, plan, usage: { used, limit } }`（`analysis` は正規化済みオブジェクト）。

### 7.3 `POST /api/meals`

- 手動・写真解析のどちらでも、最終的な食事データはここで保存。
- **ボディ:** `MealRegistrationSchema` 準拠の JSON（`eaten_at` 含む）。
- **処理:** `create_meal_with_items` RPC で `meals` / `meal_items` を作成。
- **エラー例:** `400 VALIDATION_FAILED`, `401 UNAUTHENTICATED`, `500 MEAL_CREATE_FAILED`

---

## 8. クライアント（UI）の要点

- **画面:** `/meals/new`（`MealPhotoAnalyzer`）。
- **モード:** 写真（`capture` / ギャラリー）と手動入力の切替。手動のみの場合は Gemini を呼ばない。
- **事前チェック:** 解析前に `GET /api/meals/analyze` で枠を取得し表示。クライアント側でも画像種別・5MB 制限を検証。
- **保存:** フォーム内容を `mealFormToMealAnalysis` 等で `MealAnalysis` 形に整え、`eaten_at` と合わせて `POST /api/meals`。

---

## 9. データベース

### 9.1 `ai_analysis_logs`

| 列 | 意味 |
|----|------|
| `user_id` | 解析を行ったユーザー |
| `analyzed_at` | レコード作成時刻（デフォルト `now()`） |
| `model` | 使用モデル名（環境変数の値） |
| `success` | 解析完了で `true`、失敗・中断で削除または `false` のまま（掃除対象） |

RLS: 本人の行のみ参照・挿入。論理削除ユーザーは `current_profile_active()` により拒否（マイグレーション定義に従う）。

### 9.2 ユーザー削除

`user_id` は `auth.users` に FK。Auth ユーザー削除で **CASCADE** されログも消える。

---

## 10. エラーコード（`POST /api/meals/analyze` 抜粋）

| code | 条件（例） |
|------|------------|
| `UNAUTHENTICATED` | 未ログイン |
| `GEMINI_NOT_CONFIGURED` | `GEMINI_API_KEY` なし |
| `SUPABASE_ADMIN_NOT_CONFIGURED` | サービスロールキーなし |
| `BAD_FORM_DATA` | `formData` 読取失敗 |
| `IMAGE_REQUIRED` | `image` なし |
| `INVALID_IMAGE` | MIME 不許可またはマジック不一致 |
| `IMAGE_TOO_LARGE` | 5MB 超 |
| `LIMIT_CHECK_FAILED` | 利用件数の取得失敗 |
| `ANALYSIS_LIMIT_EXCEEDED` | 429、当日上限 |
| `LOG_CREATE_FAILED` | RPC `claim_ai_analysis_slot` 失敗 |
| `BAD_IMAGE_READ` | バッファ読取失敗（枠解放） |
| `LOG_RELEASE_FAILED` | 枠解放の delete 失敗 |
| `LOG_UPDATE_FAILED` | 成功フラグ更新失敗 |
| `AI_ANALYSIS_FAILED` | 502、Gemini / JSON パース等 |

---

## 11. プライバシー・コンプライアンス

- 画像は **Google（Gemini）に送信**される。プライバシーポリシー（`app/privacy/page.tsx` 等）と整合させること。
- 推定値は参考情報であり、医療・治療目的の精度を保証しない旨を UI / 利用規約で扱うのが望ましい。

---

## 12. 関連ファイル一覧

| 領域 | パス |
|------|------|
| 解析 API | `app/api/meals/analyze/route.ts` |
| 食事登録 API | `app/api/meals/route.ts` |
| スキーマ・上限・日付 | `lib/meal-analysis.ts` |
| UI | `components/meals/meal-photo-analyzer.tsx` |
| 新規食事ページ | `app/meals/new/page.tsx` |
| 単体テスト（スキーマ等） | `tests/meal-analysis.test.ts` |
| DB | `supabase/migrations/*ai*`, `*claim_ai_analysis_slot*` |
