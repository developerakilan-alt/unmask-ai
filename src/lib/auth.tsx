import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp: AuthState['signUp'] = async (email, password) => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured.' };
    const { error } = await getSupabase().auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured.' };
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle: AuthState['signInWithGoogle'] = async () => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured.' };
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut: AuthState['signOut'] = async () => {
    if (!isSupabaseConfigured) return;
    await getSupabase().auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        configured: isSupabaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
