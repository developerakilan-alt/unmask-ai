/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        'ink-soft': '#0A0A0A',
        neon: {
          DEFAULT: '#6EE7B7',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        nexus: {
          surface: '#F1F5F9',
          'text-secondary': '#171717',
          tertiary: '#10B981',
        },
        danger: {
          DEFAULT: '#ff3b3b',
          400: '#ff6b6b',
          500: '#ff3b3b',
          600: '#e02828',
        },
      },
      fontFamily: {
        equinox: ['Geist', 'system-ui', 'sans-serif'],
        body: ['Geist', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '9px',
        lg: '9px',
        xl: '12px',
        '2xl': '12px',
        '3xl': '18px',
      },
      keyframes: {
        // Transform-only drift (no border-radius morphing) so the background
        // blobs animate on the compositor instead of repainting every frame.
        'blob-drift-a': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(6%, -4%) scale(1.08)' },
          '66%': { transform: 'translate(-4%, 5%) scale(0.95)' },
        },
        'blob-drift-b': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-7%, 6%) scale(1.12)' },
        },
        'blob-drift-c': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '40%': { transform: 'translate(5%, 4%) scale(0.9)' },
          '80%': { transform: 'translate(-5%, -5%) scale(1.05)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'ripple': {
          '0%': { transform: 'scale(1)', borderRadius: '20px' },
          '50%': { transform: 'scale(1.015)', borderRadius: '24px' },
          '100%': { transform: 'scale(1)', borderRadius: '20px' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 24px rgba(110,231,183,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(52,211,153,0.55)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'border-pulse': {
          '0%,100%': { borderColor: 'rgba(110, 231, 183, 0.2)' },
          '50%': { borderColor: 'rgba(52, 211, 153, 0.45)' },
        },
        'float-soft': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'blob-a': 'blob-drift-a 22s ease-in-out infinite',
        'blob-b': 'blob-drift-b 28s ease-in-out infinite',
        'blob-c': 'blob-drift-c 26s ease-in-out infinite',
        'spin-slow': 'spin-slow 16s linear infinite',
        'ripple': 'ripple 2.4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
        'border-pulse': 'border-pulse 4s ease-in-out infinite',
        'float-soft': 'float-soft 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
