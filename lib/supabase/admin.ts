import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured. (Legacy: SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  if (!adminClient) {
    adminClient = createClient<Database>(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}
