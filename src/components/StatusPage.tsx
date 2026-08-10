import { useEffect, useState } from 'react';
import { Activity, Cpu, Clock, Database, HeartPulse, Server, Zap } from 'lucide-react';
import { getHealth, getStats, type HealthInfo, type StatsInfo } from '../api';
import { CardSkeleton } from './Skeleton';

export default function StatusPage() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [stats, setStats] = useState<StatsInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [h, s] = await Promise.all([getHealth(), getStats()]);
        setHealth(h);
        setStats(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Status unavailable');
      }
    })();
  }, []);

  const fmtUptime = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (error || (!health && !stats)) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="glass rounded-3xl p-10">
          <p className="text-lg font-bold text-white">Status unavailable</p>
          <p className="mt-2 text-sm text-white/40">{error || 'Is the backend running?'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white">System Status</h1>
      <p className="mt-1 text-sm text-white/50">Live health and usage counters for the detection engine.</p>

      {!health ? (
        <div className="mt-6"><CardSkeleton /></div>
      ) : (
        <div className="glass mt-6 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${health.status === 'ok' ? 'bg-neon' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-base font-bold text-white capitalize">{health.status}</span>
            <span className="ml-auto text-xs text-white/40">API v{health.version}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <Server className="h-4 w-4 text-neon" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Model</p>
                <p className="text-sm font-medium text-white/80">{health.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <Cpu className="h-4 w-4 text-neon" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Deep detector</p>
                <p className="text-sm font-medium text-white/80">{health.deep_detector_ready ? 'Ready' : 'Unavailable'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <Clock className="h-4 w-4 text-neon" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Uptime</p>
                <p className="text-sm font-medium text-white/80">{fmtUptime(health.uptime_seconds)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <Database className="h-4 w-4 text-neon" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Lifetime scans</p>
                <p className="text-sm font-medium text-white/80">{health.scans_total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="glass rounded-2xl p-5 text-center">
            <HeartPulse className="mx-auto h-5 w-5 text-neon" />
            <p className="mt-2 text-2xl font-bold text-white">{stats.total_scans.toLocaleString()}</p>
            <p className="text-xs text-white/40">Total scans</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <Zap className="mx-auto h-5 w-5 text-neon" />
            <p className="mt-2 text-2xl font-bold text-white">{stats.scans_today.toLocaleString()}</p>
            <p className="text-xs text-white/40">Scans today</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <Activity className="mx-auto h-5 w-5 text-neon" />
            <p className="mt-2 text-2xl font-bold text-white">
              {stats.last_scan_at ? new Date(stats.last_scan_at * 1000).toLocaleTimeString() : '—'}
            </p>
            <p className="text-xs text-white/40">Last scan</p>
          </div>
        </div>
      )}
    </section>
  );
}
