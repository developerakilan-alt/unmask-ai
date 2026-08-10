import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isValidUrl(u: string | undefined): boolean {
  if (!u) return false;
  if (u.includes('your-project-ref') || u.includes('your-anon-key')) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
}

export const isSupabaseConfigured = isValidUrl(url) && Boolean(anonKey && anonKey !== 'your-anon-key-here' && anonKey.length > 20);

// Lazily create the client only when env vars are present, so the app never
// crashes with "supabaseUrl is required" when env isn't loaded yet.
let _client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  }
  _client = createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

// Backwards-compatible direct export for existing imports. Safe to access at
// module-eval time only when env is configured; otherwise use getSupabase().
export const supabase = isSupabaseConfigured ? getSupabase() : (null as unknown as SupabaseClient);
