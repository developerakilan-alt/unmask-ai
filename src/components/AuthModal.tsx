import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { X, ArrowRight, Loader2, Lock, Mail, MailCheck, KeyRound, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFocusTrap } from './ModalShell';

type Mode = 'login' | 'signup' | 'reset' | 'magic';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, score);
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['#ff3b3b', '#ff6b4a', '#ffb347', '#7ee07e', '#58ddf2'];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp, signInWithGoogle, signInWithGithub, signInWithMagicLink, resetPassword, configured } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const strength = mode === 'signup' ? passwordStrength(password) : { score: 0, label: '', color: '' };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'reset' || mode === 'magic') {
      if (!isEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      const { error: err } =
        mode === 'reset' ? await resetPassword(email) : await signInWithMagicLink(email);
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        setInfo(
          mode === 'reset'
            ? `Password reset link sent to ${email.trim()}. Check your inbox.`
            : `Magic link sent to ${email.trim()}. Check your inbox to sign in.`,
        );
      }
      return;
    }

    if (!isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const fn = mode === 'signup' ? signUp : signIn;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    const { error: err } = provider === 'google' ? await signInWithGoogle() : await signInWithGithub();
    if (err) setError(err);
  };

  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign up' : mode === 'reset' ? 'Reset password' : 'Magic link'}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm outline-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass w-full max-w-sm rounded-3xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Unmask AI" className="h-12 w-12 rounded-xl object-contain" />
            <span className="text-lg font-bold text-white">
              {mode === 'signup' ? 'Sign Up' : mode === 'login' ? 'Login' : mode === 'reset' ? 'Reset Password' : 'Magic Link'}
            </span>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleOAuth('google')}
                disabled={!configured}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Continue with Google"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleOAuth('github')}
                disabled={!configured}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Continue with GitHub"
              >
                <Github className="h-5 w-5" />
                GitHub
              </button>
            </div>
            {!configured && (
              <p className="mt-2 text-center text-[11px] text-amber-400/70">
                Connect Supabase and enable Google / GitHub providers to use these
              </p>
            )}

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/30">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-neon/40 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-neon/40 focus:bg-white/[0.06]"
                />
              </div>

              {mode === 'signup' && password && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor: i < strength.score ? strength.color : 'rgba(255,255,255,0.12)',
                          boxShadow: i < strength.score ? `0 0 8px ${strength.color}66` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setInfo(null);
                  }}
                  className="mt-2 text-xs font-semibold text-neon transition-colors hover:text-neon-100"
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => {
                setMode('magic');
                setError(null);
                setInfo(null);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neon/25 bg-neon/10 py-2.5 text-xs font-semibold text-neon transition-colors hover:bg-neon/15"
            >
              <MailCheck className="h-4 w-4" />
              Email me a magic link instead
            </button>
          )}

          {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
          {info && (
            <p className="rounded-lg border border-neon/30 bg-neon/10 px-3 py-2 text-xs text-neon-100">{info}</p>
          )}
          {!configured && (mode === 'login' || mode === 'signup') && (
            <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
              Supabase isn't configured yet — sign in is unavailable until env vars are loaded.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !configured}
            className="liquid-btn flex w-full items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_rgba(88,221,242,0.4)] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === 'signup' ? 'Create Account' : mode === 'login' ? 'Sign In' : mode === 'reset' ? 'Send Reset Email' : 'Send Magic Link'}
                {mode === 'login' || mode === 'signup' ? (
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <KeyRound className="h-4 w-4" strokeWidth={2.5} />
                )}
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/45">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); setInfo(null); }} className="font-semibold text-neon transition-colors hover:text-neon-100">
                Login
              </button>
            </>
          ) : (
            <>
              {mode === 'reset' || mode === 'magic' ? 'Remembered it? ' : "Don't have an account? "}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setInfo(null);
                }}
                className="font-semibold text-neon transition-colors hover:text-neon-100"
              >
                {mode === 'reset' || mode === 'magic' ? 'Back to login' : 'Sign Up'}
              </button>
            </>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
}
