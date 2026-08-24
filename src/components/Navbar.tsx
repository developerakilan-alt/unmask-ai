import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../lib/i18n';

interface NavbarProps {
  onAuthOpen: () => void;
  onPricingOpen: () => void;
}

const REPO_URL = 'https://github.com/developerakilan-alt/unmask-ai';

interface NavLink {
  key: string;
  labelKey: string;
  href: string;
  kind: 'anchor' | 'route' | 'pricing' | 'external';
}

const NAV_LINKS: NavLink[] = [
  { key: 'home', labelKey: 'nav.home', href: '#home', kind: 'anchor' },
  { key: 'features', labelKey: 'nav.features', href: '#/features', kind: 'route' },
  { key: 'about', labelKey: 'nav.about', href: '#about', kind: 'anchor' },
  { key: 'how', labelKey: 'nav.how', href: '#how-it-works', kind: 'anchor' },
  { key: 'pricing', labelKey: 'nav.pricing', href: '#pricing', kind: 'pricing' },
  { key: 'blog', labelKey: 'nav.blog', href: REPO_URL, kind: 'external' },
];

/** Compact glowing hexagonal AI shield mark. */
function HexLogo() {
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center">
      <span className="hex-logo-halo absolute inset-0" aria-hidden="true" />
      <svg viewBox="0 0 40 40" className="relative h-10 w-10 drop-shadow-[0_0_12px_rgba(52,211,153,0.55)]" aria-hidden="true">
        <defs>
          <linearGradient id="hex-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="45%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#052e21" />
          </linearGradient>
        </defs>
        <path d="M20 2.5 35 11v18L20 37.5 5 29V11Z" fill="url(#hex-face)" stroke="rgba(209,250,229,0.7)" strokeWidth="1" />
        <path d="M20 7.5 30.5 13.5v13L20 32.5 9.5 26.5v-13Z" fill="none" stroke="rgba(236,253,245,0.45)" strokeWidth="0.8" />
        <path d="M20 12l6.5 3v5.2c0 3.6-2.7 6.2-6.5 7.8-3.8-1.6-6.5-4.2-6.5-7.8V15Z" fill="rgba(2,44,34,0.88)" stroke="#d1fae5" strokeWidth="1" />
        <circle cx="20" cy="19.6" r="2.4" fill="#a7f3d0" />
      </svg>
    </span>
  );
}

export default function Navbar({ onAuthOpen, onPricingOpen }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hash, setHash] = useState(typeof window === 'undefined' ? '' : window.location.hash);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = '';
      for (const id of ['home', 'how-it-works', 'about']) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 180) current = id;
      }
      setActiveSection(current || 'home');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash);
      setMobileOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const routeActive = hash.startsWith('#/features') ? 'features' : null;
  const activeKey = routeActive ?? activeSection.replace('how-it-works', 'how');
  const underlineKey = hoveredKey ?? activeKey;

  const onLinkClick = (e: ReactMouseEvent<HTMLAnchorElement>, link: NavLink, closeDrawer: boolean) => {
    if (closeDrawer) setMobileOpen(false);
    // In-page anchors scroll manually so the hash router never sees a bare
    // "#section" and mistakes it for an unknown route.
    if (link.kind === 'anchor') {
      e.preventDefault();
      document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (link.kind === 'pricing') {
      e.preventDefault();
      onPricingOpen();
    }
  };

  const renderLinks = (closeDrawer: boolean) =>
    NAV_LINKS.map((link) => {
      const isTarget = underlineKey === link.key;
      const isActive = activeKey === link.key && !hoveredKey;
      const shared = `relative rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 ${
        isActive ? 'nav-item-active text-white' : isTarget ? 'text-white' : 'text-white/60 hover:text-white'
      }`;

      const inner = (
        <>
          {isActive && <span className="nav-item-glow pointer-events-none absolute inset-0" aria-hidden="true" />}
          <span className="relative z-10">{t(link.labelKey)}</span>
          {isTarget && (
            <motion.span
              layoutId="nav-underline"
              className="nav-active-line"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              aria-hidden="true"
            />
          )}
        </>
      );

      if (link.kind === 'external') {
        return (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={shared}
            onMouseEnter={() => setHoveredKey(link.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => closeDrawer && setMobileOpen(false)}
          >
            {inner}
          </a>
        );
      }

      return (
        <a
          key={link.key}
          href={link.href}
          className={shared}
          onMouseEnter={() => setHoveredKey(link.key)}
          onMouseLeave={() => setHoveredKey(null)}
          onFocus={() => setHoveredKey(link.key)}
          onBlur={() => setHoveredKey(null)}
          onClick={(e) => onLinkClick(e, link, closeDrawer)}
        >
          {inner}
        </a>
      );
    });

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'pt-2' : 'pt-4'}`}>
      <div className="mx-auto w-full max-w-[1180px] px-3 sm:px-5">
        {/* Large floating glass pill */}
        <motion.nav
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="nav-shell relative flex items-center justify-between gap-3 py-2 pl-3 pr-2 sm:pl-4 sm:pr-2.5"
        >
          {/* Brand */}
          <a href="#home" onClick={() => setMobileOpen(false)} className="group flex min-w-0 shrink-0 items-center gap-3" aria-label="Unmask AI home">
            <HexLogo />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-wide text-white">
                UNMASK <span className="text-neon drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">AI</span>
              </span>
              <span className="mt-0.5 hidden text-[8px] font-semibold uppercase tracking-[0.38em] text-emerald-100/45 sm:block">
                {t('nav.brandTag')}
              </span>
            </span>
          </a>

          {/* Center navigation (desktop) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex">
            <div className="pointer-events-auto flex items-center gap-0.5">{renderLinks(false)}</div>
          </div>

          {/* CTAs */}
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-2 xl:flex" title={user.email}>
                  <span className="relative grid h-8 w-8 place-items-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                    {user.email?.charAt(0) ?? 'U'}
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white/60 bg-emerald-400" aria-label="Online" />
                  </span>
                  <span className="max-w-[130px] truncate text-xs text-white/60">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="btn-ghost-green flex h-9 items-center gap-1.5 px-4 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{t('nav.signout')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onAuthOpen}
                  className="btn-ghost-green hidden h-9 items-center px-4 text-sm font-medium sm:flex"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={onAuthOpen}
                  className="btn-primary-gradient flex h-9 items-center px-5 text-sm font-bold"
                >
                  {t('nav.signup')}
                </button>
              </>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="glass fixed inset-y-0 right-0 z-50 flex w-[300px] flex-col overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-bold text-white">{t('nav.menu')}</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1">{renderLinks(true)}</div>

              <div className="my-4 h-px bg-white/10" />

              {!user && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setMobileOpen(false); onAuthOpen(); }} className="btn-ghost-green flex h-10 items-center justify-center text-sm font-medium">
                    {t('nav.login')}
                  </button>
                  <button onClick={() => { setMobileOpen(false); onAuthOpen(); }} className="btn-primary-gradient flex h-10 items-center justify-center text-sm font-bold">
                    {t('nav.signup')}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
