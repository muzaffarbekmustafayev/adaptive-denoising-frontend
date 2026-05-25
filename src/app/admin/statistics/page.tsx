'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/lib/api';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

type AdminStats = {
  QUEUED: number;
  PROCESSING: number;
  COMPLETED: number;
  FAILED: number;
  totalAudioReceived: number;
  totalDenoised: number;
  totalBytesProcessed: number;
  totalDurationProcessed: number;
  totalUsers: number;
};

type TimelinePoint = {
  _id: string;
  count: number;
  completed: number;
  failed: number;
};

const emptyStats: AdminStats = {
  QUEUED: 0,
  PROCESSING: 0,
  COMPLETED: 0,
  FAILED: 0,
  totalAudioReceived: 0,
  totalDenoised: 0,
  totalBytesProcessed: 0,
  totalDurationProcessed: 0,
  totalUsers: 0,
};

export default function AdminStatisticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('weekly');
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 90;

  const fetchStats = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError('');

    try {
      const [statsRes, timelineRes] = await Promise.all([
        adminApi.getStats(period),
        adminApi.getTimelineStats(days),
      ]);
      setStats({ ...emptyStats, ...statsRes.data.data });
      setTimeline(timelineRes.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      if (err.response?.status === 403) {
        setError('Only admin users can view system statistics.');
        return;
      }
      setError(err.response?.data?.message || 'Failed to load admin statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const filledTimeline = useMemo(() => {
    const now = new Date();
    const source = new Map(timeline.map((item) => [item._id, item]));

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - index - 1));
      const key = date.toISOString().slice(0, 10);
      const item = source.get(key);

      return {
        key,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: item?.count || 0,
        completed: item?.completed || 0,
        failed: item?.failed || 0,
      };
    });
  }, [timeline, days]);

  const maxCount = Math.max(1, ...filledTimeline.map((item) => item.count));
  const successRate = stats.totalAudioReceived > 0 ? Math.round((stats.COMPLETED / stats.totalAudioReceived) * 100) : 0;
  const activeJobs = stats.QUEUED + stats.PROCESSING;

  const statusRows = [
    { label: 'Completed', value: stats.COMPLETED, color: 'bg-emerald-600' },
    { label: 'Processing', value: stats.PROCESSING, color: 'bg-blue-600' },
    { label: 'Queued', value: stats.QUEUED, color: 'bg-amber-500' },
    { label: 'Failed', value: stats.FAILED, color: 'bg-red-600' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-72 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded bg-slate-200 dark:bg-slate-800" />)}
          </div>
          <div className="h-96 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">System Statistics</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Backend-integrated admin metrics for audio jobs, users, and processing volume.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
              className="h-10 rounded border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="daily">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <button onClick={() => fetchStats(true)} disabled={refreshing} className="btn-primary">
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <FiAlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Audio Jobs" value={stats.totalAudioReceived.toLocaleString()} caption={`${activeJobs} active`} />
          <MetricCard label="Success Rate" value={`${successRate}%`} caption={`${stats.totalDenoised} denoised`} />
          <MetricCard label="Data Processed" value={formatBytes(stats.totalBytesProcessed)} caption={`${formatDuration(stats.totalDurationProcessed)} duration`} />
          <MetricCard label="Users" value={stats.totalUsers.toLocaleString()} caption="registered accounts" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="card overflow-hidden xl:col-span-2">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="font-semibold text-slate-900 dark:text-white">Activity Overview</h2>
              <p className="text-sm text-slate-500">Daily backend job volume from `/admin/stats/timeline`.</p>
            </div>
            <div className="p-5">
              <div className="flex h-72 items-end gap-2 rounded border border-slate-200 bg-white px-3 pb-10 pt-6 dark:border-slate-800 dark:bg-slate-950">
                {filledTimeline.map((item) => (
                  <div key={item.key} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div className="absolute -top-3 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-slate-950 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
                      {item.count} jobs, {item.completed} completed, {item.failed} failed
                    </div>
                    <div className="min-h-1 rounded-t bg-blue-600/25 group-hover:bg-blue-600" style={{ height: `${Math.max(4, (item.count / maxCount) * 100)}%` }} />
                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-400">
                      {days > 14 ? item.label.split(' ')[1] : item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="font-semibold text-slate-900 dark:text-white">Job Status</h2>
              <p className="text-sm text-slate-500">Current period breakdown.</p>
            </div>
            <div className="space-y-4 p-5">
              {statusRows.map((row) => {
                const percent = stats.totalAudioReceived > 0 ? Math.round((row.value / stats.totalAudioReceived) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
                      <span className="text-slate-500">{row.value.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full ${row.color}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="font-semibold text-slate-900 dark:text-white">Timeline Data</h2>
            <p className="text-sm text-slate-500">Raw daily aggregates returned by backend.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total Jobs</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3">Failed</th>
                  <th className="px-5 py-3">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filledTimeline.slice().reverse().map((item) => {
                  const rowRate = item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0;
                  return (
                    <tr key={item.key} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{item.key}</td>
                      <td className="px-5 py-3">{item.count}</td>
                      <td className="px-5 py-3 text-emerald-600">{item.completed}</td>
                      <td className="px-5 py-3 text-red-600">{item.failed}</td>
                      <td className="px-5 py-3">{rowRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatDuration(seconds: number) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}
