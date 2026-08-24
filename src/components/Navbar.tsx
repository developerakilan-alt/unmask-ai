import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../lib/i18n';
import { LiquidNavButton } from './LiquidNavButton';
import Magnetic from './Magnetic';
import NavOrb from './NavOrb';

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
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

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

  const isActive = (href: string) => activeSection === href.replace('#', '');
  // The glowing capsule sits behind the hovered item, or the active one when
  // nothing is hovered — it springs between items via the shared layoutId.
  const isCapsuleTarget = (href: string) =>
    hoveredHref ? hoveredHref === href : isActive(href);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'pt-2' : 'pt-3.5'}`}>
      <div className="relative mx-auto w-full max-w-6xl px-3 sm:px-4">
        {/* Soft green light travelling underneath the pill */}
        <span className="nav-underglow" aria-hidden="true" />

        {/* Floating glass pill */}
        <motion.nav
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="nav-pill relative flex items-center justify-between gap-2 py-2 pl-3 pr-2 sm:pl-4"
        >
          {/* Brand — tiny 3D orb + name */}
          <a href="#home" className="group flex shrink-0 items-center gap-2.5" aria-label="Unmask AI home">
            <NavOrb size={30} />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-white">
                UNMASK <span className="neon-text">AI</span>
              </span>
              <span className="hidden text-[8px] font-semibold uppercase tracking-[0.4em] text-white/50 sm:block">
                {t('nav.brandTag')}
              </span>
            </span>
          </a>

          {/* Section links with liquid glowing capsule */}
          <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto py-0.5">
            {NAV_LINKS.map((link) => (
              <Magnetic key={link.labelKey} strength={0.15}>
                <a
                  href={link.href}
                  onMouseEnter={() => setHoveredHref(link.href)}
                  onMouseLeave={() => setHoveredHref(null)}
                  onFocus={() => setHoveredHref(link.href)}
                  onBlur={() => setHoveredHref(null)}
                  className={`relative whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
                    isActive(link.href)
                      ? 'font-semibold text-white'
                      : 'text-white/65 hover:text-white'
                  }`}
                >
                  {isCapsuleTarget(link.href) && (
                    <motion.span
                      layoutId="nav-glow-capsule"
                      className="nav-active-capsule"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{t(link.labelKey)}</span>
                </a>
              </Magnetic>
            ))}
          </div>

          {/* Auth actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {user ? (
              <>
                <div className="hidden items-center gap-2 xl:flex" title={user.email}>
                  <span className="relative grid h-8 w-8 place-items-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                    {user.email?.charAt(0) ?? 'U'}
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white/60 bg-emerald-400" aria-label="Online" />
                  </span>
                  <span className="max-w-[140px] truncate text-xs text-white/60">{user.email}</span>
                </div>
                <Magnetic strength={0.2} className="hidden sm:inline-block">
                  <LiquidNavButton
                    onClick={signOut}
                    className="glass-btn flex h-9 items-center gap-1.5 px-4 text-xs font-semibold"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{t('nav.signout')}</span>
                  </LiquidNavButton>
                </Magnetic>
              </>
            ) : (
              <>
                <Magnetic strength={0.2} className="hidden sm:inline-block">
                  <LiquidNavButton
                    onClick={onAuthOpen}
                    className="px-3 py-2 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {t('nav.login')}
                  </LiquidNavButton>
                </Magnetic>
                <Magnetic strength={0.2} className="inline-block">
                  <LiquidNavButton
                    onClick={onAuthOpen}
                    className="glass-btn-primary flex h-9 items-center px-4 text-xs font-bold"
                  >
                    {t('nav.signup')}
                  </LiquidNavButton>
                </Magnetic>
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
                    isActive(link.href) ? 'font-semibold text-white' : 'text-white/70 hover:text-white'
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
