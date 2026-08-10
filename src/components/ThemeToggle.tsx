import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
