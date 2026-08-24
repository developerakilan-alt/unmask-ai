import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../lib/i18n';
import { LiquidNavButton } from './LiquidNavButton';

interface NavbarProps {
  onAuthOpen: () => void;
}

const NAV_LINKS = [
  { labelKey: 'nav.home', href: '#home' },
  { labelKey: 'nav.features', href: '#/features' },
  { labelKey: 'nav.about', href: '#about' },
];

export default function Navbar({ onAuthOpen }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.replace('#', ''));
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
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

  const boxTilt = (e: ReactMouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = (e.clientY - r.top) / Math.max(r.height, 1);
    el.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(2)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 6).toFixed(2)}deg`);
  };

  const boxTiltReset = (e: ReactMouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'pt-2' : 'pt-4'}`}>
      {/* Full-bleed glass navigation bar — spans the entire width of the site */}
      <motion.nav
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        onMouseMove={boxTilt}
        onMouseLeave={boxTiltReset}
        className="glass nav-3d flex w-full items-center rounded-none py-2.5 pl-4 pr-3 sm:pl-6 sm:pr-4"
      >
        <div className="nav-float flex w-full items-center justify-between gap-3">
          {/* Brand — logo + name (matches footer brand block) */}
          <a href="#home" className="flex shrink-0 items-center gap-2.5" aria-label="Unmask AI home">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Unmask AI"
              className="h-9 w-9 rounded-xl object-contain ring-1 ring-inset ring-white/30"
            />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-white">
                UNMASK <span className="neon-text">AI</span>
              </span>
              <span className="hidden text-[8px] font-semibold uppercase tracking-[0.4em] text-white/50 sm:block">
                {t('nav.brandTag')}
              </span>
            </span>
          </a>

          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <a
                key={link.labelKey}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
                  activeSection === link.href.replace('#', '')
                    ? 'bg-white/15 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t(link.labelKey)}
              </a>
            ))}
          </div>

          <div className="nav-pop flex shrink-0 items-center gap-1.5">
            {user ? (
              <>
                <div className="hidden items-center gap-2 xl:flex" title={user.email}>
                  <span className="relative grid h-8 w-8 place-items-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                    {user.email?.charAt(0) ?? 'U'}
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white/60 bg-emerald-400" aria-label="Online" />
                  </span>
                  <span className="max-w-[140px] truncate text-xs text-white/60">{user.email}</span>
                </div>
                <LiquidNavButton
                  onClick={signOut}
                  className="glass-btn flex h-9 items-center gap-1.5 px-4 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('nav.signout')}</span>
                </LiquidNavButton>
              </>
            ) : (
              <>
                <LiquidNavButton
                  onClick={onAuthOpen}
                  className="hidden px-3 py-2 text-sm text-white/70 transition-colors hover:text-white sm:block"
                >
                  {t('nav.login')}
                </LiquidNavButton>
                <LiquidNavButton
                  onClick={onAuthOpen}
                  className="glass-btn-primary flex h-9 items-center px-4 text-xs font-bold"
                >
                  {t('nav.signup')}
                </LiquidNavButton>
              </>
            )}

            <LiquidNavButton
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </LiquidNavButton>
          </div>
        </div>
      </motion.nav>

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
              className="glass fixed inset-y-0 right-0 z-50 flex w-[300px] flex-col gap-1 overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-white">{t('nav.menu')}</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">{t('nav.onThisPage')}</p>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.labelKey}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm transition-colors hover:bg-white/10 ${
                    activeSection === link.href.replace('#', '') ? 'font-semibold text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t(link.labelKey)}
                </a>
              ))}

              <div className="my-2 h-px bg-white/10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
