import { z } from "zod";
import {
  TURNSTILE_TEST_SECRET_KEY,
  isTurnstileProductionWidgetMode,
} from "@/lib/security/turnstile-config";

const TurnstileVerifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

export type TurnstileValidationResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "invalid" | "request_failed" };

let warnedTurnstileKeyMismatch = false;

function warnIfTurnstileKeysMisconfigured() {
  if (warnedTurnstileKeyMismatch || !isTurnstileProductionWidgetMode()) return;
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret || !site || secret !== site) return;
  warnedTurnstileKeyMismatch = true;
  console.warn(
    "[turnstile] TURNSTILE_SECRET_KEY と NEXT_PUBLIC_TURNSTILE_SITE_KEY が同一です。Turnstile ではサイトキーとシークレットは別値です。誤って同じ文字列を入れるとチャレンジ URL が 400 になることがあります。Cloudflare ダッシュボードの該当ウィジェットで確認してください。",
  );
}

function getTurnstileSecretKey() {
  warnIfTurnstileKeysMisconfigured();
  if (!isTurnstileProductionWidgetMode()) {
    return TURNSTILE_TEST_SECRET_KEY;
  }
  const configured = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (configured) {
    return configured;
  }
  return process.env.NODE_ENV === "production"
    ? null
    : TURNSTILE_TEST_SECRET_KEY;
}

export async function validateTurnstileToken(
  token: string,
  request: Request,
): Promise<TurnstileValidationResult> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return { ok: false, code: "not_configured" };
  }

  const normalizedToken = token.trim();
  if (!normalizedToken || normalizedToken.length > 2048) {
    return { ok: false, code: "invalid" };
  }

  const remoteIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", normalizedToken);
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const parsed = TurnstileVerifyResponseSchema.safeParse(
      await response.json(),
    );
    if (!response.ok || !parsed.success) {
      return { ok: false, code: "request_failed" };
    }

    return parsed.data.success ? { ok: true } : { ok: false, code: "invalid" };
  } catch (error) {
    console.error("[turnstile] validation failed", error);
    return { ok: false, code: "request_failed" };
  }
}
