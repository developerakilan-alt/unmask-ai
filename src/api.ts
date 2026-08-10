/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Backend API client for Unmask AI.
 *
 * Sends images to the FastAPI backend for analysis and returns a
 * structured result that matches the AnalysisResult interface.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Resolve the logged-in user's id for the backend quota, or undefined for
 * anonymous. Supabase is imported lazily so the API client still works when
 * auth isn't configured.
 */
async function clientId(): Promise<string | undefined> {
  try {
    const { getSupabase, isSupabaseConfigured } = await import("./lib/supabase");
    if (!isSupabaseConfigured) return undefined;
    const { data } = await getSupabase().auth.getSession();
    return data.session?.user.id ?? undefined;
  } catch {
    return undefined;
  }
}

export type Classification = "AI_GENERATED" | "REAL" | "UNCERTAIN";

export interface Indicator {
  label: string;
  value: string;
  aiLikelihood: number;
  detail: string;
}

export interface DebugInfo {
  prediction: Classification | "UNCERTAIN";
  confidence: number | null;
  model: string;
  processing_success: boolean;
  error: string | null;
  raw_logits?: number[];
  raw_probabilities?: number[];
  label_mapping?: Record<string, string>;
  thresholds?: Record<string, number>;
}

export interface Forensics {
  exif: { present: boolean; note?: string; tags: Record<string, string> };
  noise: { noise_level: number; sharpness: number };
  colour: {
    channels?: Record<string, { mean: number; std: number; entropy: number }>;
    saturation: number;
    value: number;
  };
}

export interface BackendResult {
  classification: Classification;
  verdict: "real" | "ai" | "uncertain";
  ai_percent: number;
  real_percent: number;
  confidence: number;
  indicators: Indicator[];
  heatmap: string; // base64 data URL
  feature_scores: Record<string, number>;
  metadata: {
    model_used: string;
    features_analyzed: number;
    processing_time_ms: number;
    device: string;
  };
  debug: DebugInfo;
  scan_id?: string;
  forensics?: Forensics;
}

export interface AnalysisResult {
  classification: Classification;
  verdict: "real" | "ai" | "uncertain";
  aiPercent: number;
  realPercent: number;
  confidence: number;
  indicators: Indicator[];
  heatmap: string;
  featureScores: Record<string, number>;
  modelUsed: string;
  processingTimeMs: number;
  debug: DebugInfo;
  scanId?: string;
  forensics?: Forensics;
  sourceUrl?: string;
}

export interface ScanRecord {
  id: string;
  filename: string;
  created_at: number;
  classification: Classification;
  verdict: "real" | "ai" | "uncertain";
  ai_percent: number;
  real_percent: number;
  confidence: number;
  model?: string;
  processing_time_ms?: number;
  heatmap?: string;
  forensics?: Forensics;
  indicators?: Indicator[];
}

export interface ShareInfo {
  share_id: string;
  share_url: string;
}

export interface WebhookInfo {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: number;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  created_at: number;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  logged_in: boolean;
  resets_in_seconds: number;
  rate_limit_per_minute: number;
  rate_remaining: number;
}

export interface StatsInfo {
  total_scans: number;
  scans_today: number;
  last_scan_at: number | null;
  service_started_at: number | null;
}

export interface HealthInfo {
  status: string;
  model: string;
  deep_detector_ready: boolean;
  model_repo: string;
  privacy: string;
  version: string;
  uptime_seconds: number;
  scans_total: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Central request helper: attaches auth headers and parses errors. */
async function apiFetch<T = Record<string, any>>(path: string, init: RequestInit = {}, key?: string | null): Promise<T> {
  const headers = new Headers(init.headers || {});
  const id = await clientId();
  if (key) headers.set("Authorization", `Bearer ${key}`);
  else if (id) headers.set("X-Client-Id", id);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Backend unreachable. Is the server running on port 8000?");
  }

  let body: Record<string, any> | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body?.detail || (typeof body?.error === "string" ? body.error : `Request failed (${response.status}).`);
    throw new ApiError(response.status, message);
  }
  return (body ?? {}) as T;
}

function mapResult(data: BackendResult, sourceUrl?: string): AnalysisResult {
  return {
    classification: data.classification,
    verdict: data.verdict,
    aiPercent: data.ai_percent,
    realPercent: data.real_percent,
    confidence: data.confidence,
    indicators: data.indicators,
    heatmap: data.heatmap,
    featureScores: data.feature_scores,
    modelUsed: data.metadata?.model_used || data.debug?.model || "Unmask AI",
    processingTimeMs: data.metadata?.processing_time_ms ?? 0,
    debug: data.debug,
    scanId: data.scan_id,
    forensics: data.forensics,
    sourceUrl,
  };
}

/**
 * Send an image to the backend for forensic analysis.
 *
 * Throws an Error with a human-readable message when the backend is
 * unreachable or when detection fails (e.g. "Detection unavailable").
 * It never fabricates a REAL/AI result.
 */
export async function analyzeImage(file: File, apiKey?: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const body = await apiFetch("/api/v1/analyze", { method: "POST", body: formData }, apiKey);
  if (!body.debug?.processing_success) {
    throw new Error(body.debug?.error || "Detection unavailable");
  }
  return mapResult(body as BackendResult);
}

/** Analyze an image fetched from a public URL. */
export async function analyzeUrl(url: string, apiKey?: string): Promise<AnalysisResult> {
  const body = await apiFetch(
    "/api/v1/analyze-url",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) },
    apiKey,
  );
  if (!body.debug?.processing_success) throw new Error(body.debug?.error || "Detection unavailable");
  return mapResult(body as BackendResult, url);
}

/** Analyze several images; the backend returns per-file results (with errors inline). */
export async function analyzeBatch(
  files: File[],
): Promise<((AnalysisResult & { filename: string }) | { filename: string; error: string })[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const body = await apiFetch<{ results?: Record<string, any>[] }>("/api/v1/analyze-batch", {
    method: "POST",
    body: formData,
  });
  return (body.results || []).map((r: any) =>
    r.error ? r : { ...mapResult(r as BackendResult), filename: r.filename },
  ) as any;
}

/** Run the face-check endpoint on an image. */
export async function faceCheck(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/api/v1/face-check", { method: "POST", body: formData });
}

// ---------------------------------------------------------------------------
// Account / history
// ---------------------------------------------------------------------------
export async function getScans(): Promise<ScanRecord[]> {
  const body = await apiFetch("/api/v1/scans");
  return body.scans || [];
}

export async function deleteScan(scanId: string): Promise<void> {
  await apiFetch(`/api/v1/scans/${scanId}`, { method: "DELETE" });
}

export async function getScan(scanId: string): Promise<ScanRecord> {
  return apiFetch<ScanRecord>(`/api/v1/scans/${scanId}`);
}

export async function deleteMyData(): Promise<Record<string, number>> {
  return apiFetch("/api/v1/account/data", { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------
export async function createShare(scanId: string): Promise<ShareInfo> {
  return apiFetch<ShareInfo>("/api/v1/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId }),
  });
}

export async function getShare(shareId: string): Promise<{ result: ScanRecord }> {
  return apiFetch<{ result: ScanRecord }>(`/api/v1/shares/${shareId}`);
}

export async function deleteShare(shareId: string): Promise<void> {
  await apiFetch(`/api/v1/shares/${shareId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------
export async function listWebhooks(): Promise<WebhookInfo[]> {
  const body = await apiFetch("/api/v1/webhooks");
  return body.webhooks || [];
}

export async function createWebhook(url: string, events: string[] = ["scan.completed"]): Promise<WebhookInfo> {
  return apiFetch<WebhookInfo>("/api/v1/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, events }),
  });
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  await apiFetch(`/api/v1/webhooks/${webhookId}`, { method: "DELETE" });
}

export async function testWebhook(webhookId: string): Promise<{ sent: boolean; status_code?: number; error?: string }> {
  return apiFetch<{ sent: boolean; status_code?: number; error?: string }>(`/api/v1/webhooks/${webhookId}/test`, { method: "POST" });
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------
export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const body = await apiFetch("/api/v1/api-keys");
  return body.api_keys || [];
}

export async function createApiKey(name: string): Promise<{ id: string; name: string; key: string; created_at: number }> {
  return apiFetch<{ id: string; name: string; key: string; created_at: number }>("/api/v1/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(keyId: string): Promise<void> {
  await apiFetch(`/api/v1/api-keys/${keyId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Moderation report
// ---------------------------------------------------------------------------
export async function reportScan(scanId: string | undefined, reason: string, contact?: string): Promise<void> {
  await apiFetch("/api/v1/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId, reason, contact: contact || undefined }),
  });
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export async function getQuota(): Promise<QuotaInfo> {
  return apiFetch<QuotaInfo>("/api/v1/quota");
}

export async function getStats(): Promise<StatsInfo> {
  return apiFetch<StatsInfo>("/api/v1/stats");
}

export async function getHealth(): Promise<HealthInfo> {
  return apiFetch<HealthInfo>("/health");
}
