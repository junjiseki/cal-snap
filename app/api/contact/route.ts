import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  category: z.enum(["support", "billing", "bug", "privacy", "other"]),
  message: z.string().trim().min(10).max(2000),
});

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("送信内容を読み取れません。", 400, "BAD_JSON");
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("入力内容を確認してください。", 400, "VALIDATION_FAILED");
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
    return errorResponse("お問い合わせを送信できません。", 500, "CONTACT_CREATE_FAILED");
  }

  return Response.json({ ok: true });
}
