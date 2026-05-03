import { z } from "zod";

const TEST_TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

const TurnstileVerifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

export type TurnstileValidationResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "invalid" | "request_failed" };

function getTurnstileSecretKey() {
  const configured = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (configured) {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? null : TEST_TURNSTILE_SECRET_KEY;
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
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const parsed = TurnstileVerifyResponseSchema.safeParse(await response.json());
    if (!response.ok || !parsed.success) {
      return { ok: false, code: "request_failed" };
    }

    return parsed.data.success ? { ok: true } : { ok: false, code: "invalid" };
  } catch (error) {
    console.error("[turnstile] validation failed", error);
    return { ok: false, code: "request_failed" };
  }
}
