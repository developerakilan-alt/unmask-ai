import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, Menu, X, Github, LayoutDashboard, BookOpen, TerminalSquare, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { navigate } from '../lib/router';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  onAuthOpen: () => void;
}

const ANCHOR_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Technology', href: '#technology' },
  { label: 'API', href: '#api' },
  { label: 'About', href: '#about' },
];

const ROUTE_LINKS = [
  { label: 'Dashboard', icon: LayoutDashboard, route: 'dashboard' },
  { label: 'API Docs', icon: BookOpen, route: 'docs' },
  { label: 'Playground', icon: TerminalSquare, route: 'playground' },
  { label: 'Status', icon: HeartPulse, route: 'status' },
];

export default function Navbar({ onAuthOpen }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (route: string) => {
    setMobileOpen(false);
    navigate(route);
  };

  return (
    <header className="px-4 pt-5 sm:px-6 sticky top-0 z-50">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Unmask AI" className="h-12 w-12 rounded-xl object-contain" />
          <button onClick={() => go('home')} className="text-lg font-bold tracking-tight text-white">
            Unmask AI
          </button>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 lg:flex">
          {ANCHOR_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-2 text-sm text-white/60 transition-colors hover:text-white rounded-lg hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          {ROUTE_LINKS.map((link) => (
            <button
              key={link.route}
              onClick={() => go(link.route)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/60 transition-colors hover:text-white rounded-lg hover:bg-white/5"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden text-sm text-white/60 sm:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="glass-pill flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onAuthOpen}
                className="px-2 text-sm text-white/70 transition-colors hover:text-white sm:px-3"
              >
                Login
              </button>
              <button
                onClick={onAuthOpen}
                className="liquid-btn glass-pill rounded-xl px-4 py-2 text-sm font-semibold text-neon transition-colors hover:text-neon-100"
              >
                Sign Up
              </button>
            </>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:grid h-9 w-9 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass mx-auto mt-2 max-w-6xl rounded-2xl p-4 lg:hidden"
          >
            {ROUTE_LINKS.map((link) => (
              <button
                key={link.route}
                onClick={() => go(link.route)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
            <div className="my-2 h-px bg-white/10" />
            {ANCHOR_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
