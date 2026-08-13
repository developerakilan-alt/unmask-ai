import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, Menu, X, Github, LayoutDashboard, BookOpen, TerminalSquare, HeartPulse, Search, FlaskConical, Clapperboard, ShieldCheck, Languages, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigate } from '../lib/router';
import { useI18n } from '../lib/i18n';
import ThemeToggle from './ThemeToggle';
import { LiquidNavButton, LiquidNavLink } from './LiquidNavButton';

interface NavbarProps {
  onAuthOpen: () => void;
  onOpenPalette: () => void;
  onOpenPricing: () => void;
}

const ANCHOR_LINKS = [
  { labelKey: 'nav.features', href: 'features' },
  { labelKey: 'nav.technology', href: 'technology' },
  { labelKey: 'nav.api', href: 'api' },
  { labelKey: 'nav.about', href: 'about' },
];

const ROUTE_LINKS = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, route: 'dashboard' },
  { labelKey: 'nav.compare', icon: FlaskConical, route: 'compare' },
  { labelKey: 'nav.video', icon: Clapperboard, route: 'video' },
  { labelKey: 'nav.source', icon: ShieldCheck, route: 'source' },
  { labelKey: 'nav.apiDocs', icon: BookOpen, route: 'docs' },
  { labelKey: 'nav.playground', icon: TerminalSquare, route: 'playground' },
  { labelKey: 'nav.status', icon: HeartPulse, route: 'status' },
];

export default function Navbar({ onAuthOpen, onOpenPalette, onOpenPricing }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const ids = ANCHOR_LINKS.map((l) => l.href);
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) current = id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const go = (route: string) => {
    setMobileOpen(false);
    navigate(route);
  };

  const boxTilt = (e: ReactMouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = (e.clientY - r.top) / Math.max(r.height, 1);
    el.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(2)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
  };

  const boxTiltReset = (e: ReactMouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <header className={`sticky top-0 z-50 px-4 transition-all duration-300 sm:px-6 ${scrolled ? 'pt-2' : 'pt-5'}`}>
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
          scrolled ? 'glass shadow-[0_8px_40px_rgba(0,0,0,0.5)]' : 'glass-pill'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img src="/logo.png" alt="Unmask AI" className="h-12 w-12 rounded-xl object-contain" />
            <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-neon/30" />
          </div>
          <button onClick={() => go('home')} className="text-lg font-bold tracking-tight text-white">
            Unmask <span className="neon-text">AI</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LiquidNavButton
            onClick={onOpenPalette}
            className="hidden h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 md:flex"
            title="Search (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1 text-[9px]">⌘K</kbd>
          </LiquidNavButton>

          <ThemeToggle />
          <LiquidNavButton
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-2.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            title={t('nav.language')}
          >
            <Languages className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{lang === 'en' ? 'ES' : 'EN'}</span>
          </LiquidNavButton>
          <LiquidNavButton
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 rounded-xl bg-neon px-3.5 py-2 text-xs font-bold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,102,0.4)]"
          >
            <Zap className="h-3.5 w-3.5" />
            {t('nav.upgrade')}
          </LiquidNavButton>
          {user ? (
            <>
              <span className="hidden text-sm text-white/60 lg:inline">{user.email}</span>
              <LiquidNavButton
                onClick={signOut}
                className="glass-pill flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('nav.signout')}</span>
              </LiquidNavButton>
            </>
          ) : (
            <>
              <LiquidNavButton
                onClick={onAuthOpen}
                className="px-2 text-sm text-white/70 transition-colors hover:text-white sm:px-3"
              >
                {t('nav.login')}
              </LiquidNavButton>
              <LiquidNavButton
                onClick={onAuthOpen}
                className="glass-pill rounded-xl px-4 py-2 text-sm font-semibold text-neon transition-colors hover:text-neon-100"
              >
                {t('nav.signup')}
              </LiquidNavButton>
            </>
          )}

          <LiquidNavLink
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:grid h-9 w-9 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </LiquidNavLink>

          {/* Mobile menu toggle */}
          <LiquidNavButton
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </LiquidNavButton>
        </div>
      </nav>

      {/* Left side box — on-page links (fixed, aligned with upload zone) */}
      <div className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
        <div className="side-box-float">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
          className="side-box flex flex-col items-stretch gap-0.5 p-1.5"
          onMouseMove={boxTilt}
          onMouseLeave={boxTiltReset}
        >
          {ANCHOR_LINKS.map((link) => (
            <LiquidNavLink
              key={link.labelKey}
              href={`#${link.href}`}
              active={activeSection === link.href}
              className={`px-3 py-2 text-sm transition-colors rounded-lg hover:bg-white/5 ${
                activeSection === link.href ? 'font-semibold text-neon' : 'text-white/60 hover:text-white'
              }`}
            >
              {t(link.labelKey)}
            </LiquidNavLink>
          ))}
        </motion.div>
        </div>
      </div>

      {/* Right side box — app pages, one by one (fixed, aligned with upload zone) */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
        <div className="side-box-float side-box-float-delayed">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
          className="side-box flex w-52 flex-col gap-0.5 p-2"
          onMouseMove={boxTilt}
          onMouseLeave={boxTiltReset}
        >
          {ROUTE_LINKS.map((link) => (
            <LiquidNavButton
              key={link.route}
              onClick={() => go(link.route)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <link.icon className="h-3.5 w-3.5 text-neon/80" />
              {t(link.labelKey)}
            </LiquidNavButton>
          ))}
        </motion.div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="glass fixed inset-y-0 right-0 z-50 flex w-[300px] flex-col gap-1 overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-white">{t('nav.menu')}</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">{t('nav.pages')}</p>
              {ROUTE_LINKS.map((link) => (
                <button
                  key={link.route}
                  onClick={() => go(link.route)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <link.icon className="h-4 w-4 text-neon" />
                  {t(link.labelKey)}
                </button>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenPricing();
                }}
                className="flex items-center gap-3 rounded-xl bg-neon/10 px-3 py-3 text-sm font-semibold text-neon transition-colors hover:bg-neon/20"
              >
                <Zap className="h-4 w-4" />
                {t('nav.upgrade')}
              </button>

              <div className="my-2 h-px bg-white/10" />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">{t('nav.onThisPage')}</p>
              {ANCHOR_LINKS.map((link) => (
                <a
                  key={link.labelKey}
                  href={`#${link.href}`}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm transition-colors hover:bg-white/5 ${
                    activeSection === link.href ? 'font-semibold text-neon' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t(link.labelKey)}
                </a>
              ))}

              <div className="my-2 h-px bg-white/10" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenPalette();
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Search className="h-4 w-4 text-neon" /> {t('nav.search')}…
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
