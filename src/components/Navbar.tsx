import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, Menu, X, Github, LayoutDashboard, BookOpen, TerminalSquare, HeartPulse, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigate } from '../lib/router';
import ThemeToggle from './ThemeToggle';
import { LiquidNavButton, LiquidNavLink } from './LiquidNavButton';

interface NavbarProps {
  onAuthOpen: () => void;
  onOpenPalette: () => void;
}

const ANCHOR_LINKS = [
  { label: 'Features', href: 'features' },
  { label: 'Technology', href: 'technology' },
  { label: 'API', href: 'api' },
  { label: 'About', href: 'about' },
];

const ROUTE_LINKS = [
  { label: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
  { label: 'API Docs', icon: BookOpen, route: 'docs' },
  { label: 'Playground', icon: TerminalSquare, route: 'playground' },
  { label: 'Status', icon: HeartPulse, route: 'status' },
];

export default function Navbar({ onAuthOpen, onOpenPalette }: NavbarProps) {
  const { user, signOut } = useAuth();
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

  return (
    <header className={`sticky top-0 z-50 px-4 transition-all duration-300 sm:px-6 ${scrolled ? 'pt-2' : 'pt-5'}`}>
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
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
          </button>        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 lg:flex">
          {ANCHOR_LINKS.map((link) => (
            <LiquidNavLink
              key={link.label}
              href={`#${link.href}`}
              active={activeSection === link.href}
              className={`px-3 py-2 text-sm transition-colors rounded-lg hover:bg-white/5 ${
                activeSection === link.href ? 'font-semibold text-neon' : 'text-white/60 hover:text-white'
              }`}
            >
              {link.label}
            </LiquidNavLink>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          {ROUTE_LINKS.map((link) => (
            <LiquidNavButton
              key={link.route}
              onClick={() => go(link.route)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/60 transition-colors hover:text-white rounded-lg hover:bg-white/5"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </LiquidNavButton>
          ))}
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
          {user ? (
            <>
              <span className="hidden text-sm text-white/60 lg:inline">{user.email}</span>
              <LiquidNavButton
                onClick={signOut}
                className="glass-pill flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </LiquidNavButton>
            </>
          ) : (
            <>
              <LiquidNavButton
                onClick={onAuthOpen}
                className="px-2 text-sm text-white/70 transition-colors hover:text-white sm:px-3"
              >
                Login
              </LiquidNavButton>
              <LiquidNavButton
                onClick={onAuthOpen}
                className="glass-pill rounded-xl px-4 py-2 text-sm font-semibold text-neon transition-colors hover:text-neon-100"
              >
                Sign Up
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
                <p className="text-sm font-bold text-white">Menu</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">Pages</p>
              {ROUTE_LINKS.map((link) => (
                <button
                  key={link.route}
                  onClick={() => go(link.route)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <link.icon className="h-4 w-4 text-neon" />
                  {link.label}
                </button>
              ))}

              <div className="my-2 h-px bg-white/10" />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">On this page</p>
              {ANCHOR_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={`#${link.href}`}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm transition-colors hover:bg-white/5 ${
                    activeSection === link.href ? 'font-semibold text-neon' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
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
                <Search className="h-4 w-4 text-neon" /> Search…
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
