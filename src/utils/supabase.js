import { createClient } from "@supabase/supabase-js";

let supabaseClient;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) throw new Error("Supabase production configuration is missing.");

  supabaseClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });

  return supabaseClient;
}

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
}
