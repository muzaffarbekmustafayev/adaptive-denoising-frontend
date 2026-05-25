'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { audioApi, apiKeyApi, usageApi, type AudioJob, type ApiKey } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FiActivity,
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiDownload,
  FiKey,
  FiRefreshCw,
  FiTrendingUp,
} from 'react-icons/fi';

type RangeOption = 7 | 14 | 30;

type ChartDay = {
  key: string;
  label: string;
  jobs: number;
  completed: number;
  processing: number;
  queued: number;
  failed: number;
  bytes: number;
  successRate: number;
};

const getLocalDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type UsageSummary = {
  totalRequests: number;
  totalDurationSeconds: number;
  totalInputBytes: number;
  totalOutputBytes: number;
  successCount: number;
  failedCount: number;
};

const STATUS_COLORS: Record<AudioJob['status'], string> = {
  COMPLETED: '#10b981',
  PROCESSING: '#3b82f6',
  QUEUED: '#f59e0b',
  FAILED: '#ef4444',
};

export default function StatisticsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<AudioJob[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [range, setRange] = useState<RangeOption>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError('');

    try {
      const [jobsRes, keysRes] = await Promise.all([
        audioApi.getMyJobs(),
        apiKeyApi.list(),
      ]);
      setJobs(jobsRes.data.data);
      setApiKeys(keysRes.data.data);
      try {
        const usageRes = await usageApi.getSummary();
        setUsageSummary(usageRes.data.data || null);
      } catch {
        // Usage data is optional for the page; keep UI functional without blocking other stats.
        setUsageSummary(null);
      }
      setLastUpdatedAt(new Date());
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.response?.data?.message || 'Failed to load activity statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchData();
    }, 8000);

    const onFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const chartDays = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: range }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (range - index - 1));

      return {
        key: getLocalDayKey(date),
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        jobs: 0,
        completed: 0,
        processing: 0,
        queued: 0,
        failed: 0,
        bytes: 0,
        successRate: 0,
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));

    jobs.forEach((job) => {
      const key = getLocalDayKey(new Date(job.createdAt));
      const day = dayMap.get(key);
      if (!day) return;

      day.jobs += 1;
      day.bytes += job.inputBytes || 0;
      if (job.status === 'COMPLETED') day.completed += 1;
      if (job.status === 'PROCESSING') day.processing += 1;
      if (job.status === 'QUEUED') day.queued += 1;
      if (job.status === 'FAILED') day.failed += 1;
    });

    return days.map((day) => ({
      ...day,
      successRate: day.jobs > 0 ? Math.round((day.completed / day.jobs) * 100) : 0,
    }));
  }, [jobs, range]);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const completed = jobs.filter((job) => job.status === 'COMPLETED').length;
    const failed = jobs.filter((job) => job.status === 'FAILED').length;
    const processing = jobs.filter((job) => job.status === 'PROCESSING').length;
    const queued = jobs.filter((job) => job.status === 'QUEUED').length;
    const active = processing + queued;
    const totalBytes = jobs.reduce((sum, job) => sum + (job.inputBytes || 0), 0);
    const totalOutputBytes = jobs.reduce((sum, job) => sum + (job.outputBytes || 0), 0);
    const completedJobs = jobs.filter((job) => job.status === 'COMPLETED');
    const jobsWithDuration = completedJobs.filter((job) => job.durationSeconds);
    const jobsWithMetrics = jobs.filter((job) => job.qualityMetrics?.snrImprovementDb);
    const avgSnrImp = jobsWithMetrics.length
      ? jobsWithMetrics.reduce((sum, job) => sum + (job.qualityMetrics?.snrImprovementDb || 0), 0) / jobsWithMetrics.length
      : 0;
    const avgDuration = jobsWithDuration.length
      ? jobsWithDuration.reduce((sum, job) => sum + (job.durationSeconds || 0), 0) / jobsWithDuration.length
      : 0;

    return {
      totalJobs,
      completed,
      failed,
      processing,
      queued,
      active,
      totalMB: totalBytes / (1024 * 1024),
      outputMB: totalOutputBytes / (1024 * 1024),
      efficiency: totalBytes > 0 ? Math.round((totalOutputBytes / totalBytes) * 100) : 0,
      successRate: totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0,
      avgSnrImp,
      avgDuration,
    };
  }, [jobs]);

  const usageMetrics = useMemo(() => {
    const summary = usageSummary;
    const total = summary?.totalRequests || 0;
    const success = summary?.successCount || 0;
    const failed = summary?.failedCount || 0;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    const avgDuration = total > 0 ? (summary?.totalDurationSeconds || 0) / total : 0;
    const compressionRate = (summary?.totalInputBytes || 0) > 0
      ? Math.round(((summary?.totalOutputBytes || 0) / (summary?.totalInputBytes || 0)) * 100)
      : 0;

    return {
      total,
      success,
      failed,
      successRate,
      avgDuration,
      compressionRate,
    };
  }, [usageSummary]);

  const statusBreakdown = useMemo(() => {
    const statuses: AudioJob['status'][] = ['COMPLETED', 'PROCESSING', 'QUEUED', 'FAILED'];
    return statuses.map((status) => ({
      status,
      count: jobs.filter((job) => job.status === status).length,
      color: STATUS_COLORS[status],
    }));
  }, [jobs]);

  const apiKeyUsage = useMemo(() => {
    return [...apiKeys]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }, [apiKeys]);

  const recentJobs = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 8),
    [jobs]
  );

  const maxJobs = Math.max(1, ...chartDays.map((day) => day.jobs));
  const maxKeyUsage = Math.max(1, ...apiKeyUsage.map((key) => key.usageCount));

  const exportReport = () => {
    const rows = [
      ['Created At', 'File', 'Status', 'Input MB', 'Output MB', 'Duration Seconds'],
      ...jobs.map((job) => [
        new Date(job.createdAt).toISOString(),
        job.originalFileName || '',
        job.status,
        ((job.inputBytes || 0) / (1024 * 1024)).toFixed(2),
        ((job.outputBytes || 0) / (1024 * 1024)).toFixed(2),
        String(job.durationSeconds || 0),
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatMB = (value: number) => `${value.toFixed(value >= 10 ? 1 : 2)} MB`;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const visibleDays = chartDays;
  const maxSuccess = Math.max(1, ...visibleDays.map((day) => day.successRate));
  const totalRangeBytes = visibleDays.reduce((sum, day) => sum + day.bytes, 0);
  const totalRangeJobs = visibleDays.reduce((sum, day) => sum + day.jobs, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-12 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              <FiActivity className="h-3.5 w-3.5" />
              Live Activity
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Statistics</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
              Monitor denoising volume, job outcomes, API key activity, and recent processing history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Last update: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : '...'}
            </span>
            <button
              onClick={exportReport}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-500/40 hover:text-blue-600 dark:border-slate-800 dark:text-slate-300"
            >
              <FiDownload className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-primary min-h-10"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
            <FiAlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<FiTrendingUp />} label="Success Rate" value={`${stats.successRate}%`} caption={`${stats.completed} completed of ${stats.totalJobs}`} tone="blue" />
          <MetricCard icon={<FiDatabase />} label="Data Processed" value={formatMB(stats.totalMB)} caption={`${formatMB(stats.outputMB)} output`} tone="indigo" />
          <MetricCard icon={<FiCheckCircle />} label="Avg SNR Gain" value={`${stats.avgSnrImp.toFixed(1)} dB`} caption="Completed jobs with metrics" tone="emerald" />
          <MetricCard icon={<FiClock />} label="Active Jobs" value={String(stats.active)} caption={`${stats.queued} queued, ${stats.processing} processing`} tone="amber" />
        </div>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Usage Summary</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Aggregated request-level usage from backend usage logs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<FiActivity />} label="Requests" value={usageMetrics.total.toLocaleString()} caption={`${usageMetrics.success.toLocaleString()} success / ${usageMetrics.failed.toLocaleString()} failed`} tone="blue" />
            <MetricCard icon={<FiCheckCircle />} label="Usage Success" value={`${usageMetrics.successRate}%`} caption="Based on usage records" tone="emerald" />
            <MetricCard icon={<FiClock />} label="Avg Duration" value={`${usageMetrics.avgDuration.toFixed(1)}s`} caption="Per usage request" tone="amber" />
            <MetricCard icon={<FiDatabase />} label="Output Ratio" value={`${usageMetrics.compressionRate}%`} caption="Output bytes / input bytes" tone="indigo" />
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Activity Overview</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily job volume, status split, and exact totals for the selected period.</p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
              {[7, 14, 30].map((option) => (
                <button
                  key={option}
                  onClick={() => setRange(option as RangeOption)}
                  className={`rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition ${
                    range === option
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {option}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[1.6fr_1fr]">
            <section className="rounded-xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Daily Volume</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Success {stats.successRate}%</span>
                  <span>Total {totalRangeJobs}</span>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Peak {maxJobs}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleDays.map((day) => {
                  const volumeWidth = Math.max(4, (day.jobs / maxJobs) * 100);
                  return (
                    <div key={day.key} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">{day.label}</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{day.jobs} jobs</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${volumeWidth}%` }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400">{day.successRate}% success</span>
                        <span className="text-slate-500">{formatBytes(day.bytes)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Status Mix</span>
                <span className="text-xs font-bold text-slate-500">{totalRangeJobs} jobs</span>
              </div>

              <div className="space-y-4">
                {statusBreakdown.map((item) => {
                  const ratio = totalRangeJobs > 0 ? Math.round((item.count / totalRangeJobs) * 100) : 0;
                  return (
                    <div key={item.status}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{item.status}</span>
                        <span className="font-black text-slate-900 dark:text-white">{item.count} ({ratio}%)</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(2, ratio)}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bytes</div>
                  <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatBytes(totalRangeBytes)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Success</div>
                  <div className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">{stats.successRate}%</div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <section className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Status Breakdown</h2>
              <FiBarChart2 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
              <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#10b981_0_0)]" style={{ background: getConicGradient(statusBreakdown, stats.totalJobs) }}>
                <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center dark:bg-slate-950">
                  <div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalJobs}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jobs</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.status.toLowerCase()}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">API Key Usage</h2>
              <FiKey className="h-5 w-5 text-slate-400" />
            </div>
            {apiKeyUsage.length === 0 ? (
              <EmptyState text="No API keys yet" />
            ) : (
              <div className="space-y-4">
                {apiKeyUsage.map((key) => (
                  <div key={key._id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{key.name}</span>
                      <span className="text-xs font-black text-slate-500">{key.usageCount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full ${key.isActive ? 'bg-blue-600' : 'bg-slate-400'}`}
                        style={{ width: `${Math.max(3, (key.usageCount / maxKeyUsage) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Processing Health</h2>
              <FiActivity className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-5">
              <HealthRow label="Avg Duration" value={`${stats.avgDuration.toFixed(1)}s`} />
              <HealthRow label="Output Ratio" value={`${stats.efficiency}%`} />
              <HealthRow label="Failed Jobs" value={String(stats.failed)} danger={stats.failed > 0} />
              <div className="rounded-lg bg-slate-900 p-4 text-white">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Queue Load</span>
                  <span className="text-xs font-black text-emerald-400">{stats.active === 0 ? 'Idle' : 'Active'}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, stats.active * 20)}%` }} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Jobs</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Latest jobs with quick actions.
              </p>
            </div>
            <button
              onClick={() => router.push('/denoise')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:border-blue-500/40 hover:text-blue-600 dark:border-slate-800 dark:text-slate-300"
            >
              New Job
            </button>
          </div>
          {recentJobs.length === 0 ? (
            <EmptyState text="No recent jobs found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">File</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Input</th>
                    <th className="px-6 py-4">Output</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentJobs.map((job) => (
                    <tr key={job._id}>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{job.originalFileName}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                          job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          job.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(job.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatBytes(job.inputBytes || 0)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatBytes(job.outputBytes || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {job.status === 'COMPLETED' && (
                            <button
                              onClick={async () => {
                                const res = await audioApi.downloadOutput(job._id);
                                const url = URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `denoised_${job.originalFileName || 'audio'}`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                            >
                              Download
                            </button>
                          )}
                          {(job.status === 'FAILED' || job.status === 'COMPLETED') && (
                            <button
                              onClick={async () => {
                                await audioApi.retryJob(job._id);
                                await fetchData(true);
                              }}
                              className="rounded border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Daily Data</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Every selected day with exact counts and bytes.</p>
          </div>
          {visibleDays.length === 0 ? (
            <EmptyState text="No jobs have been processed yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="text-xs font-black uppercase tracking-widest text-slate-500">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Jobs</th>
                    <th className="px-6 py-4">Completed</th>
                    <th className="px-6 py-4">Processing</th>
                    <th className="px-6 py-4">Queued</th>
                    <th className="px-6 py-4">Failed</th>
                    <th className="px-6 py-4">Bytes</th>
                    <th className="px-6 py-4">Success</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleDays.slice().reverse().map((day) => (
                    <tr key={day.key} className="text-sm">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{day.label}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{day.jobs}</td>
                      <td className="px-6 py-4 text-emerald-600">{day.completed}</td>
                      <td className="px-6 py-4 text-blue-600">{day.processing}</td>
                      <td className="px-6 py-4 text-amber-600">{day.queued}</td>
                      <td className="px-6 py-4 text-red-600">{day.failed}</td>
                      <td className="px-6 py-4 font-medium text-slate-500">{formatBytes(day.bytes)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{day.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ icon, label, value, caption, tone }: { icon: ReactNode; label: string; value: string; caption: string; tone: 'blue' | 'indigo' | 'emerald' | 'amber' }) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };

  return (
    <div className="stat-card">
      <div className="mb-5 flex items-center justify-between">
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>{icon}</div>
      </div>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="mt-2 text-xs font-bold text-slate-400">{caption}</span>
    </div>
  );
}

function HealthRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 dark:border-slate-800">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className={`text-sm font-black ${danger ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-6 py-10 text-center">
      <p className="text-sm font-bold text-slate-500">{text}</p>
    </div>
  );
}

function getConicGradient(items: { count: number; color: string }[], total: number) {
  if (total === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';

  let cursor = 0;
  const stops = items
    .filter((item) => item.count > 0)
    .map((item) => {
      const start = cursor;
      const end = cursor + (item.count / total) * 360;
      cursor = end;
      return `${item.color} ${start}deg ${end}deg`;
    });

  return `conic-gradient(${stops.join(', ')})`;
}
