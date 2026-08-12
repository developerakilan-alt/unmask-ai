import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../lib/theme';
import { LiquidNavButton } from './LiquidNavButton';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <LiquidNavButton
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/50 transition-colors hover:text-white"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </motion.span>
    </LiquidNavButton>
  );
}
