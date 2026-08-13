/**
 * Pro tier / billing helpers.
 *
 * Checkout is wired for Stripe Payment Links (no backend required): drop the
 * publishable key + a Payment Link URL into the Vite env and the UI becomes
 * live. Without them the upgrade flow explains the setup instead of failing.
 */

export interface Plan {
  id: string;
  name: string;
  priceLabel: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    blurb: 'For casual checks and trying the API.',
    features: ['20 scans / day', 'Standard model', 'On-device Quick Scan', 'Community support'],
    cta: 'Current plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9',
    blurb: 'For creators, journalists and teams.',
    features: ['Unlimited scans', 'Full forensic heatmaps', 'Video & batch analysis', 'API keys & webhooks', 'Priority queue'],
    highlight: true,
    cta: 'Upgrade',
  },
  {
    id: 'team',
    name: 'Team',
    priceLabel: '$29',
    blurb: 'For organizations with shared quotas.',
    features: ['Everything in Pro', 'Seats for 5 members', 'SSO', 'Dedicated support'],
    cta: 'Contact',
  },
];

const PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(PAYMENT_LINK && /^https:\/\/buy\.stripe\.com\//i.test(PAYMENT_LINK));
}

export function getPlan(): 'free' | 'pro' {
  try {
    return localStorage.getItem('unmask-plan') === 'pro' ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

export function setPlan(plan: 'free' | 'pro') {
  try {
    localStorage.setItem('unmask-plan', plan);
  } catch {
    /* ignore */
  }
}

/**
 * Start checkout for a plan. Returns a status string describing what
 * happened so the UI can react (e.g. "opening", "needs-setup").
 */
export async function startCheckout(planId: string): Promise<{ ok: boolean; message?: string; url?: string }> {
  if (planId === 'free') return { ok: true };
  if (!isStripeConfigured()) {
    return {
      ok: false,
      message:
        'Billing is not wired up yet. Add VITE_STRIPE_PAYMENT_LINK (and VITE_STRIPE_PUBLISHABLE_KEY) to the build env to enable checkout.',
    };
  }
  if (PAYMENT_LINK) {
    window.open(PAYMENT_LINK, '_blank', 'noopener');
    return { ok: true, url: PAYMENT_LINK };
  }
  return { ok: false, message: 'Checkout is unavailable right now.' };
}
