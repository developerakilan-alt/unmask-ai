/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050505',
        'ink-soft': '#0A0F0A',
        neon: {
          DEFAULT: '#00FF88',
          50: '#d0ffe8',
          100: '#b3ffda',
          200: '#80ffc2',
          300: '#4dffaa',
          400: '#1aff92',
          500: '#00FF88',
          600: '#00C853',
          700: '#00993d',
          800: '#006628',
          900: '#003314',
        },
        danger: {
          DEFAULT: '#ff3b3b',
          400: '#ff6b6b',
          500: '#ff3b3b',
          600: '#e02828',
        },
      },
      fontFamily: {
        equinox: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
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
          '0%,100%': { boxShadow: '0 0 24px rgba(0,255,136,0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(0,255,136,0.45)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'border-pulse': {
          '0%,100%': { borderColor: 'rgba(0, 255, 136, 0.15)' },
          '50%': { borderColor: 'rgba(0, 255, 136, 0.35)' },
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
      },
    },
  },
  plugins: [],
};
