import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#/features' },
      { label: 'Technology', href: '#technology' },
      { label: 'AI Detector', href: '#detector' },
      { label: 'API', href: '#api' },
    ],
  },
  {
    title: 'Technology',
    links: [
      { label: 'AI Models', href: '#technology' },
      { label: 'API Documentation', href: '#/docs' },
      { label: 'Playground', href: '#/playground' },
      { label: 'Detector Calibration', href: '#/calibration' },
      { label: 'System Status', href: '#/status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy Policy', href: '#/privacy' },
      { label: 'Terms of Service', href: '#/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative z-10 pb-14 pt-10">
      <div className="glass relative w-full overflow-hidden rounded-none">
          {/* top highlight + sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[70%] -translate-x-1/2 rounded-[100%] bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(209, 250, 229,0.35),rgba(52, 211, 153,0.05)_60%,transparent)] blur-2xl" />

          <div className="relative px-8 py-20 sm:sm:px-12 sm:py-28">
            <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-5">
              {/* Brand column */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3">
                  <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Unmask AI" className="h-10 w-10 rounded-2xl object-contain ring-1 ring-inset ring-white/30" />
                  <div>
                    <p className="text-base font-bold tracking-wide text-white">
                      UNMASK <span className="neon-text">AI</span>
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.5em] text-white/50">AI Content Detector</p>
                  </div>
                </div>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
                  Pixel-level forensic analysis to detect AI-generated images. Built for researchers, journalists, and investigators.
                </p>
                <div className="mt-6 flex gap-2.5">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white/50 transition-all hover:border-white/60 hover:text-white hover:shadow-[0_0_18px_rgba(52, 211, 153,0.3)]" aria-label="GitHub">
                    <Github className="h-4 w-4" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white/50 transition-all hover:border-white/60 hover:text-white hover:shadow-[0_0_18px_rgba(52, 211, 153,0.3)]" aria-label="LinkedIn">
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a href="mailto:contact@unmask.ai" className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white/50 transition-all hover:border-white/60 hover:text-white hover:shadow-[0_0_18px_rgba(52, 211, 153,0.3)]" aria-label="Email">
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Link columns */}
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">{col.title}</h4>
                  <ul className="space-y-2.5 text-sm text-white/65">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} className="inline-flex items-center gap-1.5 transition-colors hover:text-neon">
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
          <div className="relative border-t border-white/15">
            <div className="flex flex-col items-center gap-3 px-8 py-8 sm:flex-row sm:justify-between sm:sm:px-12">
              <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Unmask AI. All rights reserved.</p>
              <p className="text-xs text-white/40">
                Built with <span className="text-neon/70">React</span>,{' '}
                <span className="text-neon/70">TensorFlow</span>,{' '}
                <span className="text-neon/70">OpenCV</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="glass-pill rounded-full px-2.5 py-1 text-[10px] font-medium text-white/50" title="App version">
                  v2.1.0
                </span>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="glass-btn h-9 w-9 rounded-full"
                  aria-label="Back to top"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
    </footer>
  );
}
