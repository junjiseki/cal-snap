const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function getExpectedOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin;
    } catch {
      /* fall through to request headers */
    }
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;

  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export function isAllowedOrigin(request: Request) {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
    return true;
  }

  const actualOrigin = getRequestOrigin(request);
  const expectedOrigin = getExpectedOrigin(request);

  if (!actualOrigin || !expectedOrigin) {
    return false;
  }

  return actualOrigin === expectedOrigin;
}

export function forbiddenOriginResponse() {
  return Response.json(
    {
      error: {
        message: "不正なリクエストです。",
        code: "FORBIDDEN_ORIGIN",
      },
    },
    { status: 403 },
  );
}
