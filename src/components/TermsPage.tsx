export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      <p className="mt-1 text-sm text-white/40">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="glass mt-6 space-y-5 rounded-2xl p-6 text-sm leading-relaxed text-white/65">
        <div>
          <h2 className="mb-1 font-semibold text-white">1. Purpose</h2>
          <p>
            Unmask AI provides automated analysis of images to estimate the likelihood of AI generation. Results are
            probabilistic and indicative — not proof. Always corroborate findings with additional evidence.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">2. Acceptable use</h2>
          <p>
            You may use the service to analyze images you have the right to analyze. You may not use the service to harass,
            defame, or mislead others, or to build tools that present results as conclusive evidence in legal proceedings.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">3. No warranty</h2>
          <p>
            The service is provided "as is" without warranties of any kind. Detection accuracy varies by image, and we do
            not guarantee that results are error-free.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">4. Fair-use quota</h2>
          <p>
            Anonymous users are limited to a small number of scans per day; logged-in users receive a higher allowance.
            Batch and automated use is governed by the quota system.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">5. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Unmask AI is not liable for any damages arising from the use of, or
            inability to use, the service or its outputs.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white">6. Changes</h2>
          <p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p>
        </div>
      </div>
    </section>
  );
}
