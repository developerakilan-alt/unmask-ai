import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { AuthProvider } from './lib/auth.tsx';
import { ThemeProvider } from './lib/theme.tsx';
import { ToastProvider } from './lib/toast.tsx';
import { LanguageProvider } from './lib/i18n.tsx';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
