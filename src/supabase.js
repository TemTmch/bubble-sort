import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

// One shared client. Implicit flow so an e-mail link opened on another device
// (e.g. requested on a laptop, opened on a phone) still signs the teacher in.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: "implicit", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "bs.auth" }
});

// Where e-mail links should send the teacher back to: this page, without any #route.
export function siteUrl() {
  return location.origin + location.pathname;
}
