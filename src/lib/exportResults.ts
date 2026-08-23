/**
 * Export helpers: CSV serialization and a combined PDF report for batch
 * results and scan history. Depends on jspdf (already bundled).
 */

export interface ExportRow {
  filename: string;
  classification: string;
  verdict: 'ai' | 'real' | 'uncertain' | 'error';
  ai_percent: number | null;
  confidence: number | null;
  model: string;
  created_at?: number;
  generator?: string | null;
  phash?: string | null;
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(rows: ExportRow[]): string {
  const header = [
    'filename',
    'classification',
    'verdict',
    'ai_percent',
    'confidence',
    'model',
    'date',
    'attributed_generator',
    'perceptual_hash',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        csvEscape(r.filename),
        csvEscape(r.classification),
        csvEscape(r.verdict),
        r.ai_percent == null ? '' : r.ai_percent,
        r.confidence == null ? '' : r.confidence,
        csvEscape(r.model),
        r.created_at ? new Date(r.created_at * 1000).toISOString() : '',
        csvEscape(r.generator || ''),
        csvEscape(r.phash || ''),
      ].join(','),
    ),
  ];
  return lines.join('\n');
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Build a compact one-page-per-verdict-summary PDF from rows. */
export async function rowsToPdfBlob(rows: ExportRow[]): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = 210;
  const ml = 14;

  doc.setFillColor(6, 24, 42);
  doc.rect(0, 0, pw, 297, 'F');
  doc.setFillColor(45, 212, 191);
  doc.rect(0, 0, pw, 3, 'F');

  doc.setFontSize(20);
  doc.setTextColor(45, 212, 191);
  doc.text('UNMASK AI — ANALYSIS EXPORT', ml, 18);
  doc.setFontSize(8);
  doc.setTextColor(150, 190, 205);
  doc.text(`${rows.length} result(s) · ${new Date().toLocaleString()}`, ml, 24);

  const colors: Record<string, [number, number, number]> = {
    AI_GENERATED: [255, 59, 59],
    REAL: [52, 211, 153],
    UNCERTAIN: [251, 191, 36],
    error: [120, 130, 140],
  };

  let y = 34;
  const rowH = 9;
  for (const r of rows) {
    if (y > 282) {
      doc.addPage();
      doc.setFillColor(6, 24, 42);
      doc.rect(0, 0, pw, 297, 'F');
      doc.setFillColor(45, 212, 191);
      doc.rect(0, 0, pw, 3, 'F');
      y = 14;
    }
    const c = colors[r.classification] || colors.error;
    doc.setFillColor(...c);
    doc.roundedRect(ml, y, rowH - 1, rowH - 1, 1.2, 1.2, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(230, 242, 248);
    doc.text(doc.splitTextToSize(r.filename, 88)[0], ml + 12, y + 4.5);
    doc.setFontSize(8);
    doc.setTextColor(120, 165, 185);
    doc.text(r.classification, ml + 108, y + 4.5);
    doc.text(r.ai_percent == null ? '—' : `${r.ai_percent}%`, ml + 130, y + 4.5);
    doc.text(r.generator || '—', ml + 148, y + 4.5);
    doc.text(r.model.slice(0, 20), ml + 180, y + 4.5);
    y += rowH;
  }
  return doc.output('blob');
}

export async function downloadRowsPdf(rows: ExportRow[], filename: string): Promise<void> {
  const blob = await rowsToPdfBlob(rows);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
