import { Github, Linkedin, Mail } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Technology', href: '#technology' },
      { label: 'API', href: '#api' },
      { label: 'Dashboard', href: '#/dashboard' },
      { label: 'API Playground', href: '#/playground' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'API Documentation', href: '#/docs' },
      { label: 'System Status', href: '#/status' },
      { label: 'Webhooks', href: '#/dashboard' },
      { label: 'API Keys', href: '#/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Methodology', href: '#technology' },
      { label: 'Accuracy Benchmarks', href: '#technology' },
      { label: 'Batch Scanner', href: '#batch' },
      { label: 'Privacy Promise', href: '#privacy' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#/privacy' },
      { label: 'Terms of Service', href: '#/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-black/30">
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full bg-white/[0.04] py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        Back to top
      </button>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Unmask AI" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-base font-bold text-white">Unmask AI</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              Pixel-level forensic analysis to detect AI-generated images. Built for researchers, journalists, and investigators.
            </p>
            <div className="flex gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/40 transition-all hover:border-neon/30 hover:text-neon hover:bg-neon/5" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/40 transition-all hover:border-neon/30 hover:text-neon hover:bg-neon/5" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="mailto:contact@unmask.ai" className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/40 transition-all hover:border-neon/30 hover:text-neon hover:bg-neon/5" aria-label="Email">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold text-white">{col.title}</h4>
              <ul className="space-y-2 text-xs text-white/50">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-neon"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Unmask AI. All rights reserved.</p>
          <p className="text-xs text-white/30">
            Built with{' '}
            <span className="text-neon/60">React</span>,{' '}
            <span className="text-neon/60">TensorFlow</span>,{' '}
            <span className="text-neon/60">OpenCV</span>
          </p>
          <p className="text-sm font-semibold text-neon/70 flex items-center gap-2">
            Developed by Akilan
            <span className="glass-pill rounded-full px-2 py-0.5 text-[10px] font-medium text-white/40" title="App version">
              v2.1.0
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
