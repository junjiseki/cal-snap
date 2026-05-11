import type { Plan } from "@/lib/supabase/database.types";

const DEFAULT_FREE_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_PAID_GEMINI_MODEL = "gemini-2.5-flash";

function readModelEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getGeminiModelForPlan(plan: Plan) {
  const fallbackModel = readModelEnv("GEMINI_MODEL");
  if (plan === "paid") {
    return (
      readModelEnv("GEMINI_PAID_MODEL") ??
      fallbackModel ??
      DEFAULT_PAID_GEMINI_MODEL
    );
  }

  return (
    readModelEnv("GEMINI_FREE_MODEL") ??
    fallbackModel ??
    DEFAULT_FREE_GEMINI_MODEL
  );
}
