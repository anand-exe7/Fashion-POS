import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.warn("Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not set properly.");
}

// Secret (service-role) key: bypasses RLS. Server-side use only.
export const supabaseAdmin = createClient(url || "https://placeholder.supabase.co", secret || "placeholder_key", {
  auth: { persistSession: false, autoRefreshToken: false },
});
