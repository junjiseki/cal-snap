import { GoogleGenAI } from "@google/genai";
import {
  MAX_IMAGE_BYTES,
  MealAnalysisSchema,
  getDailyAnalysisLimit,
  getDayRangeInJapan,
  getTodayRangeInJapan,
  toConfidence,
  toInteger,
} from "@/lib/meal-analysis";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import type { Plan } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const mealAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "total_calories",
    "protein",
    "fat",
    "carbs",
    "ai_confidence",
    "memo",
    "items",
  ],
  properties: {
    total_calories: { type: "number" },
    protein: { type: "number" },
    fat: { type: "number" },
    carbs: { type: "number" },
    ai_confidence: { type: "number" },
    memo: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "estimated_amount",
          "calories",
          "protein",
          "fat",
          "carbs",
          "confidence",
        ],
        properties: {
          name: { type: "string" },
          estimated_amount: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          fat: { type: "number" },
          carbs: { type: "number" },
          confidence: { type: "number" },
        },
      },
    },
  },
};

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

/** Gemini が 429 / クレジット枯渇などで拒否した場合（アプリの1日上限とは別） */
function isGeminiProviderQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? Number((error as { status: unknown }).status) : NaN;
  if (status === 429) return true;

  const raw =
    "message" in error && typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : error instanceof Error
        ? error.message
        : "";
  if (
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("prepayment credits are depleted") ||
    raw.includes('"code":429') ||
    raw.includes('"status":"RESOURCE_EXHAUSTED"')
  ) {
    return true;
  }
  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; status?: string };
    };
    if (parsed?.error?.code === 429) return true;
    if (parsed?.error?.status === "RESOURCE_EXHAUSTED") return true;
  } catch {
    /* message が JSON でない */
  }
  return false;
}

/** 運用ログ用。ユーザー向けレスポンスには含めない。 */
function summarizeGeminiClientError(error: unknown): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  if (error == null) {
    summary.value = error;
    return summary;
  }
  if (typeof error !== "object") {
    summary.value = error;
    return summary;
  }
  const obj = error as Record<string, unknown>;
  if (typeof obj.status !== "undefined") {
    summary.status = obj.status;
  }
  if (typeof obj.code !== "undefined") {
    summary.code = obj.code;
  }
  let message: string | undefined;
  if (typeof obj.message === "string") {
    message = obj.message;
  } else if (error instanceof Error) {
    message = error.message;
  }
  if (message !== undefined) {
    summary.message =
      message.length > 3000 ? `${message.slice(0, 3000)}…[truncated]` : message;
  }
  if (error instanceof Error && error.stack) {
    summary.stack = error.stack;
  }
  return summary;
}

function hasExpectedImageSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

async function getOrCreateProfile(userId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("plan,daily_calorie_goal")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.plan) {
    return { plan: data.plan, daily_calorie_goal: data.daily_calorie_goal };
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, plan: "free" })
    .select("plan,daily_calorie_goal")
    .single();

  if (insertError) {
    throw insertError;
  }

  return { plan: created.plan, daily_calorie_goal: created.daily_calorie_goal };
}

async function getTodayUsage(userId: string, plan: Plan) {
  const { supabase } = await getAuthenticatedUser();
  const dailyLimit = getDailyAnalysisLimit(plan);
  const { start, endExclusive } = getTodayRangeInJapan();

  const { count, error } = await supabase
    .from("ai_analysis_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("success", true)
    .gte("analyzed_at", start)
    .lt("analyzed_at", endExclusive);

  if (error) {
    throw error;
  }

  const used = count ?? 0;
  return {
    used,
    limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - used),
  };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  try {
    const profile = await getOrCreateProfile(user.id);
    const plan = profile.plan as Plan;
    const usage = await getTodayUsage(user.id, plan);
    const { start, endExclusive } = getDayRangeInJapan();
    const { data: summary, error: summaryError } = await supabase
      .rpc("get_daily_meal_summary", { p_start: start, p_end: endExclusive })
      .single();
    if (summaryError) {
      console.error("[meals/analyze GET] get_daily_meal_summary failed", summaryError);
    }
    const goalCalories = profile.daily_calorie_goal ?? 2000;
    if (summaryError) {
      return Response.json({
        plan,
        usage,
        goalCalories,
        todaySummaryOk: false as const,
      });
    }
    return Response.json({
      plan,
      usage,
      goalCalories,
      todaySummaryOk: true as const,
      todayCalories: Number(summary?.calories ?? 0),
    });
  } catch {
    return errorResponse("利用状況を取得できません。", 500, "USAGE_FETCH_FAILED");
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  if (!process.env.GEMINI_API_KEY) {
    return errorResponse(
      "GEMINI_API_KEY が設定されていません。",
      500,
      "GEMINI_NOT_CONFIGURED",
    );
  }

  let supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch {
    return errorResponse(
      "SUPABASE_SECRET_KEY が設定されていません。",
      500,
      "SUPABASE_ADMIN_NOT_CONFIGURED",
    );
  }

  let file: File | null = null;

  try {
    const formData = await request.formData();
    const maybeFile = formData.get("image");
    file = maybeFile instanceof File ? maybeFile : null;
  } catch {
    return errorResponse("画像フォームを読み取れません。", 400, "BAD_FORM_DATA");
  }

  if (!file) {
    return errorResponse("画像を選択してください。", 400, "IMAGE_REQUIRED");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse("JPEG、PNG、WebP の画像を選択してください。", 400, "INVALID_IMAGE");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return errorResponse("画像サイズは5MB以下にしてください。", 413, "IMAGE_TOO_LARGE");
  }

  const plan = (await getOrCreateProfile(user.id)).plan as Plan;
  let usage;
  try {
    usage = await getTodayUsage(user.id, plan);
  } catch {
    return errorResponse("解析回数を確認できません。", 500, "LIMIT_CHECK_FAILED");
  }

  if (usage.used >= usage.limit) {
    return errorResponse(
      `本日の解析上限に達しました。${plan === "paid" ? "有料" : "無料"}プランは1日${usage.limit}回までです。`,
      429,
      "ANALYSIS_LIMIT_EXCEEDED",
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let logId: string | null = null;

  const { start, endExclusive } = getTodayRangeInJapan();
  const { data: claim, error: claimError } = await supabase.rpc(
    "claim_ai_analysis_slot",
    {
      p_user_id: user.id,
      p_model: model,
      p_daily_limit: usage.limit,
      p_day_start: start,
      p_day_end: endExclusive,
    },
  );

  if (claimError) {
    return errorResponse("解析枠を確保できません。", 500, "LOG_CREATE_FAILED");
  }

  const claimedSlot = claim?.[0];
  if (!claimedSlot) {
    return errorResponse(
      `本日の解析上限に達しました。${plan === "paid" ? "有料" : "無料"}プランは1日${usage.limit}回までです。`,
      429,
      "ANALYSIS_LIMIT_EXCEEDED",
    );
  }

  logId = claimedSlot.log_id;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch {
    const { error: releaseSlotError } = await supabaseAdmin
      .from("ai_analysis_logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", user.id);
    if (releaseSlotError) {
      return errorResponse("解析枠の解放に失敗しました。", 500, "LOG_RELEASE_FAILED");
    }
    return errorResponse("画像を読み取れません。", 400, "BAD_IMAGE_READ");
  }

  if (!hasExpectedImageSignature(file.type, bytes)) {
    const { error: releaseSlotError } = await supabaseAdmin
      .from("ai_analysis_logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", user.id);
    if (releaseSlotError) {
      return errorResponse("解析枠の解放に失敗しました。", 500, "LOG_RELEASE_FAILED");
    }
    return errorResponse(
      "画像の内容が形式と一致しません。JPEG・PNG・WebP の実データを選択してください。",
      400,
      "INVALID_IMAGE",
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: bytes.toString("base64"),
          },
        },
        {
          text: [
            "You estimate nutrition from meal photos.",
            "Return JSON only, matching the supplied schema.",
            "If unsure, make a conservative estimate and reflect uncertainty in confidence values.",
            "食事写真から料理ごとの名称、推定量、カロリー、PFC、信頼度を推定してください。",
            "値は日本語の一般的な食事管理アプリで修正しやすい単位にしてください。",
          ].join("\n"),
        },
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: mealAnalysisJsonSchema,
      },
    });

    if (!response.text) {
      throw new Error("Gemini response was empty.");
    }

    const parsed = MealAnalysisSchema.parse(JSON.parse(response.text));
    const normalized = {
      total_calories: toInteger(parsed.total_calories),
      protein: toInteger(parsed.protein),
      fat: toInteger(parsed.fat),
      carbs: toInteger(parsed.carbs),
      ai_confidence: toConfidence(parsed.ai_confidence),
      memo: parsed.memo,
      items: parsed.items.map((item) => ({
        name: item.name,
        estimated_amount: item.estimated_amount,
        calories: toInteger(item.calories),
        protein: toInteger(item.protein),
        fat: toInteger(item.fat),
        carbs: toInteger(item.carbs),
        confidence: toConfidence(item.confidence),
      })),
    };

    const { error: markSuccessError } = await supabaseAdmin
      .from("ai_analysis_logs")
      .update({ success: true })
      .eq("id", logId)
      .eq("user_id", user.id);
    if (markSuccessError) {
      return errorResponse("解析結果の記録に失敗しました。", 500, "LOG_UPDATE_FAILED");
    }

    return Response.json({
      analysis: normalized,
      plan,
      usage: {
        used: claimedSlot.used,
        limit: claimedSlot.daily_limit,
      },
    });
  } catch (error) {
    const { error: releaseSlotError } = await supabaseAdmin
      .from("ai_analysis_logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", user.id);
    if (releaseSlotError) {
      return errorResponse("解析枠の解放に失敗しました。", 500, "LOG_RELEASE_FAILED");
    }

    if (isGeminiProviderQuotaError(error)) {
      console.warn(
        "[meal-analyze] Gemini 側の利用制限または課金（429 / RESOURCE_EXHAUSTED 等）。AI Studio のプロジェクト課金・クレジットを確認してください。",
        summarizeGeminiClientError(error),
        error,
      );
      return errorResponse(
        "AI解析サービスが一時的に利用できません。時間をおいて再度お試しください。解消しない場合は運営へお問い合わせください。",
        503,
        "AI_PROVIDER_QUOTA",
      );
    }

    console.error("[meal-analyze]", error);

    return errorResponse("AI解析に失敗しました。", 502, "AI_ANALYSIS_FAILED");
  }
}
