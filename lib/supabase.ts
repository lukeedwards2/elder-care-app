// lib/supabase.ts
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// ✅ Never throw at module import time (prevents TestFlight launch crashes)
export function assertSupabaseConfigured(): { ok: true } | { ok: false; message: string } {
  if (isConfigured) return { ok: true };
  return {
    ok: false,
    message:
      'Supabase env vars are missing in this build.\n\nMake sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set for your EAS production build.',
  };
}

// Create a client even if missing env vars (so imports don’t crash the app)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// --- ✅ Crash-prevention: keep a cached session in memory ---
let cachedSession: Session | null = null;

// Bootstrap once (don’t crash even if misconfigured)
(async () => {
  try {
    if (!isConfigured) return;
    const { data, error } = await supabase.auth.getSession();
    if (!error) cachedSession = data.session ?? null;
  } catch (e) {
    console.error('Supabase bootstrap session error:', e);
  }
})();

// Keep cache updated on login/logout/token refresh
supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

/**
 * Safe helper to get the current auth session.
 * Never throws – returns Session | null.
 */
export async function getSessionSafe(): Promise<Session | null> {
  try {
    if (!isConfigured) return null;
    if (cachedSession) return cachedSession;

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }

    cachedSession = data.session ?? null;
    return cachedSession;
  } catch (e) {
    console.error('Unexpected error in getSessionSafe:', e);
    return null;
  }
}






