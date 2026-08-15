/**
 * Waitlist / early-access signups. When Supabase is configured the signup is
 * mirrored to the `waitlist` table (see supabase/migration.sql). Otherwise it
 * is stored locally so the UX still works on a demo deployment. Best-effort,
 * never throws.
 */
import { isSupabaseConfigured, getSupabase } from './supabase';

const KEY = 'unmask-waitlist';

export interface WaitlistEntry {
  email: string;
  source?: string;
  created_at: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function getLocalWaitlist(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as WaitlistEntry[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function alreadyJoined(email: string): boolean {
  const norm = email.trim().toLowerCase();
  return getLocalWaitlist().some((e) => e.email.toLowerCase() === norm);
}

export async function joinWaitlist(email: string, source = 'site'): Promise<{ ok: boolean; message?: string }> {
  const clean = email.trim();
  if (!isValidEmail(clean)) return { ok: false, message: 'Please enter a valid email address.' };
  if (alreadyJoined(clean)) return { ok: false, message: 'This email is already on the list.' };

  const entry: WaitlistEntry = { email: clean, source, created_at: Date.now() };

  if (isSupabaseConfigured) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('waitlist').insert({ email: clean, source });
      if (error) throw error;
    } catch (e) {
      // Mirrored locally below even if the insert fails, so the user still gets a confirmation.
      console.warn('[waitlist] supabase insert failed, keeping local copy', e);
    }
  }

  try {
    const list = getLocalWaitlist();
    list.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  } catch {
    /* ignore quota errors */
  }

  return { ok: true };
}
