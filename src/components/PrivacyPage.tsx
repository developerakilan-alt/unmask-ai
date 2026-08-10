export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-1 text-sm text-white/40">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="glass mt-6 space-y-5 rounded-2xl p-6 text-sm leading-relaxed text-white/65">
        <div>
          <h2 className="mb-1 font-semibold text-white">1. Images are not stored</h2>
          <p>
            Uploaded images are processed in memory and are never written to disk on our servers. Each analysis returns a
            report (classification, indicators, heatmap), and the original image is discarded immediately after analysis.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">2. Scan history</h2>
          <p>
            When you are logged in, we keep a record of your analysis results (metadata only — never the original image) so
            you can review your history. You can delete individual scans or wipe all of your data at any time from the
            dashboard's "Delete my data" section.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">3. Authentication</h2>
          <p>
            Login is provided through Supabase (Google / email). Your identity is used only to tie scan history and quotas
            to your account. We never sell or share your personal data.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">4. API keys & webhooks</h2>
          <p>
            API keys are stored as one-way hashes; the raw key is shown exactly once at creation. Webhook endpoints you
            configure receive analysis result payloads (without the original image).
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">5. Cookies & local storage</h2>
          <p>
            We use local browser storage for preferences (theme, consent). No third-party tracking cookies are used.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">6. Contact</h2>
          <p>Questions about privacy? Use the "Report a scan" contact field on any result, or reach us at privacy@unmask-ai.app.</p>
        </div>
      </div>
    </section>
  );
}
