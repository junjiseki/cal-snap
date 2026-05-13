import { z } from "zod";
import {
  forbiddenOriginResponse,
  isAllowedOrigin,
} from "@/lib/security/request";
import { validateTurnstileToken } from "@/lib/security/turnstile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(
      /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}々〆ヶー・　\s]+$/u,
      "お名前は日本語で入力してください。",
    ),
  email: z.string().trim().email().max(160),
  category: z.enum(["support", "billing", "bug", "privacy", "other"]),
  message: z.string().trim().min(10).max(2000),
  submittedAt: z.number().int().positive(),
  website: z.string().max(200).optional().default(""),
  turnstileToken: z.string().trim().min(1).max(2048),
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const MIN_SUBMIT_ELAPSED_MS = 2500;
const MAX_SUBMIT_ELAPSED_MS = 2 * 60 * 60 * 1000;
/** プロセス内レート制限用。ユニークキー増加でメモリが伸びないよう TTL 相当の整理と件数上限をかける */
const MAX_TRACKED_CLIENT_KEYS = 8192;
const requestHistory = new Map<string, number[]>();
const urlPattern = /https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,}/gi;

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

function getClientKey(request: Request, email?: string) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";
  return `${ip}:${email?.toLowerCase() ?? "anonymous"}`;
}

function pruneRequestHistory(now: number) {
  for (const [k, timestamps] of requestHistory) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      requestHistory.delete(k);
    } else if (recent.length !== timestamps.length) {
      requestHistory.set(k, recent);
    }
  }
  while (requestHistory.size > MAX_TRACKED_CLIENT_KEYS) {
    const first = requestHistory.keys().next().value;
    if (first === undefined) break;
    requestHistory.delete(first);
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  pruneRequestHistory(now);
  const recent = (requestHistory.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestHistory.set(key, recent);
    return true;
  }
  recent.push(now);
  requestHistory.set(key, recent);
  return false;
}

function countUrls(text: string) {
  return text.match(urlPattern)?.length ?? 0;
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("送信内容を読み取れません。", 400, "BAD_JSON");
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "入力内容を確認してください。",
      400,
      "VALIDATION_FAILED",
    );
  }

  if (parsed.data.website) {
    return Response.json({ ok: true });
  }

  const elapsed = Date.now() - parsed.data.submittedAt;
  if (elapsed < MIN_SUBMIT_ELAPSED_MS || elapsed > MAX_SUBMIT_ELAPSED_MS) {
    return errorResponse(
      "時間をおいてから再度送信してください。",
      429,
      "SPAM_DETECTED",
    );
  }

  if (countUrls(parsed.data.message) > 2) {
    return errorResponse(
      "URLが多すぎます。内容を確認してください。",
      400,
      "TOO_MANY_LINKS",
    );
  }

  const turnstile = await validateTurnstileToken(
    parsed.data.turnstileToken,
    request,
  );
  if (!turnstile.ok) {
    const message =
      turnstile.code === "not_configured"
        ? "Turnstileのシークレットキーが未設定です。"
        : "スパム対策の確認に失敗しました。ページを更新して再度お試しください。";
    return errorResponse(message, 400, "TURNSTILE_FAILED");
  }

  const clientKey = getClientKey(request, parsed.data.email);
  if (isRateLimited(clientKey)) {
    return errorResponse(
      "短時間に送信できる回数を超えました。時間をおいてから再度送信してください。",
      429,
      "RATE_LIMITED",
    );
  }

  let supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch {
    return errorResponse(
      "お問い合わせを保存する設定が不足しています。",
      500,
      "CONTACT_NOT_CONFIGURED",
    );
  }

  const { user } = await getAuthenticatedUser();
  const { error } = await supabaseAdmin.from("contact_messages").insert({
    user_id: user?.id ?? null,
    name: parsed.data.name,
    email: parsed.data.email,
    category: parsed.data.category,
    message: parsed.data.message,
  });

  if (error) {
    return errorResponse(
      "お問い合わせを送信できません。",
      500,
      "CONTACT_CREATE_FAILED",
    );
  }

  return Response.json({ ok: true });
}
