// lib/supabase.ts

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  processLock,
  Session,
} from '@supabase/supabase-js';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const configuredAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = Boolean(
  configuredUrl.trim() && configuredAnonKey.trim()
);

/*
 * createClient requires a nonempty URL and key.
 * These harmless fallback values prevent an import-time crash if a
 * production build is accidentally missing its environment variables.
 * All guarded helpers below still treat Supabase as unconfigured.
 */
const supabaseUrl = isConfigured
  ? configuredUrl
  : 'https://placeholder.supabase.co';

const supabaseAnonKey = isConfigured
  ? configuredAnonKey
  : 'placeholder-anon-key';

export function assertSupabaseConfigured():
  | { ok: true }
  | { ok: false; message: string } {
  if (isConfigured) {
    return { ok: true };
  }

  return {
    ok: false,
    message:
      'Supabase is not configured for this build.\n\n' +
      'Make sure EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY are available in the ' +
      'EAS production environment.',
  };
} 

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      ...(Platform.OS !== 'web'
        ? { storage: AsyncStorage }
        : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);

let cachedSession: Session | null = null;

// Keep the cached session synchronized.
supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

// Start and stop token refreshing based on app state.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/**
 * Safely returns the current session.
 * This helper never throws and returns null when Supabase is unavailable.
 */
export async function getSessionSafe(): Promise<Session | null> {
  try {
    if (!isConfigured) {
      console.error(
        'Supabase environment variables are missing.'
      );
      return null;
    }

    if (cachedSession) {
      return cachedSession;
    }

    const { data, error } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        'Error getting Supabase session:',
        error
      );
      return null;
    }

    cachedSession = data.session ?? null;
    return cachedSession;
  } catch (error) {
    console.error(
      'Unexpected error in getSessionSafe:',
      error
    );
    return null;
  }
}






