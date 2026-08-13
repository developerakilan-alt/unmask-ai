import { useState } from 'react';
import { Check, Crown, Loader2, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PLANS, getPlan, isStripeConfigured, startCheckout, type Plan } from '../lib/billing';
import { useToast } from '../lib/toast';
import { useI18n } from '../lib/i18n';

function planName(id: string, t: (k: string) => string) {
  if (id === 'free') return t('plan.free');
  if (id === 'team') return t('plan.team');
  return t('plan.pro');
}

export default function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { push } = useToast();
  const { t } = useI18n();
  const [active, setActive] = useState<'free' | 'pro'>(getPlan());
  const [busy, setBusy] = useState<string | null>(null);

  const onUpgraded = (planId: string) => {
    try {
      localStorage.setItem('unmask-plan', planId);
    } catch {
      /* ignore */
    }
    setActive(getPlan());
    push('success', t('plan.activated'), planName(planId, t));
  };

  const click = async (plan: Plan) => {
    if (plan.id === 'free') {
      try {
        localStorage.setItem('unmask-plan', 'free');
      } catch {
        /* ignore */
      }
      setActive('free');
      return;
    }
    setBusy(plan.id);
    const res = await startCheckout(plan.id);
    setBusy(null);
    if (!res.ok) {
      push('info', planName(plan.id, t), res.message);
      return;
    }
    onUpgraded(plan.id);
  };

  const isFreeActive = active === 'free';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pricing-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-white">
                <Crown className="h-5 w-5 text-neon" />
                {t('pro.title')}
              </h2>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const highlight = Boolean(plan.highlight);
                const current = plan.id === 'free' && isFreeActive;
                const label =
                  plan.id === 'free'
                    ? current
                      ? t('plan.current')
                      : t('plan.downgrade')
                    : plan.id === 'team'
                      ? t('plan.contact')
                      : t('plan.upgrade');
                const disabled = current || busy === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-5 ${
                      highlight ? 'border-neon/40 shadow-[0_0_20px_rgba(0,255,102,0.2)]' : 'border-white/10'
                    }`}
                  >
                    {highlight && (
                      <span className="absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-neon px-2.5 py-0.5 text-[10px] font-bold text-black">
                        <Sparkles className="h-3 w-3" />
                        {t('pro.badge')}
                      </span>
                    )}
                    <p className="text-sm font-bold text-white">{planName(plan.id, t)}</p>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{plan.priceLabel}</span>
                      {plan.id !== 'free' && <span className="text-xs text-white/40">{t('pro.month')}</span>}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">{plan.blurb}</p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => click(plan)}
                      disabled={disabled}
                      className={`mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed ${
                        disabled
                          ? 'cursor-not-allowed bg-white/[0.06] text-white/30'
                          : highlight
                            ? 'bg-neon text-black hover:bg-neon/90 hover:shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                            : 'border border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {busy === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {label}
                    </button>
                  </div>
                );
              })}
            </div>

            {!isStripeConfigured() && (
              <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-center text-xs text-amber-400/80">
                {t('plan.checkoutNote')}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
