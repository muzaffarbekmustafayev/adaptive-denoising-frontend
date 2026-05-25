'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, authApi, type User } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { FiDownload, FiShield } from 'react-icons/fi';

type AdminStats = {
  QUEUED: number;
  PROCESSING: number;
  COMPLETED: number;
  FAILED: number;
  totalAudioReceived: number;
  totalUsers: number;
};

type TimelinePoint = {
  _id: string;
  count: number;
  completed: number;
  failed: number;
};

const EMPTY_STATS: AdminStats = {
  QUEUED: 0,
  PROCESSING: 0,
  COMPLETED: 0,
  FAILED: 0,
  totalAudioReceived: 0,
  totalUsers: 0,
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [error, setError] = useState('');
  const router = useRouter();

  const loadAdminData = async () => {
    const userRes = await authApi.getMe();
    if (userRes.data.data.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    const [usersRes, statsRes, timelineRes] = await Promise.all([
      adminApi.getUsers(),
      adminApi.getStats(period),
      adminApi.getTimelineStats(14),
    ]);

    setUsers(usersRes.data.data || []);
    setStats({ ...EMPTY_STATS, ...statsRes.data.data });
    setTimeline(timelineRes.data.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadAdminData();
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
          return;
        }
        setError(err.response?.data?.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, period]);

  const statCards = useMemo(
    () => [
      { title: 'Total Users', value: stats.totalUsers },
      { title: 'Audio Jobs', value: stats.totalAudioReceived },
      { title: 'Completed', value: stats.COMPLETED },
      { title: 'Active Queue', value: stats.QUEUED + stats.PROCESSING },
    ],
    [stats]
  );

  const statusDistribution = useMemo(() => {
    const total = Math.max(1, stats.totalAudioReceived);
    return [
      { label: 'Completed', count: stats.COMPLETED, color: 'bg-emerald-500', percent: Math.round((stats.COMPLETED / total) * 100) },
      { label: 'Processing', count: stats.PROCESSING, color: 'bg-blue-500', percent: Math.round((stats.PROCESSING / total) * 100) },
      { label: 'Queued', count: stats.QUEUED, color: 'bg-amber-500', percent: Math.round((stats.QUEUED / total) * 100) },
      { label: 'Failed', count: stats.FAILED, color: 'bg-red-500', percent: Math.round((stats.FAILED / total) * 100) },
    ];
  }, [stats]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  const exportUsersCsv = () => {
    const rows = [
      ['Full Name', 'Email', 'Role', 'Status', 'Created At'],
      ...users.map((user) => [
        user.fullName || '',
        user.email,
        user.role,
        user.status,
        new Date(user.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const maxTimelineCount = Math.max(1, ...timeline.map((item) => item.count));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Admin Panel</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Clear system overview, user registry, and processing health.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as 'daily' | 'weekly' | 'monthly')}
                  className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
              <button onClick={loadAdminData} className="btn-secondary px-3 py-2 text-sm">
              Refresh
            </button>
          </div>
        </header>

        {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
            <FiShield className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.title} className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.title}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="card overflow-hidden xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="font-semibold text-slate-900 dark:text-white">Users</h2>
              <button onClick={exportUsersCsv} className="btn-secondary px-3 py-2 text-sm font-semibold">
                <FiDownload className="h-4 w-4" />
                Export CSV
              </button>
            </div>            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Identity</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800">
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{user.fullName || 'Anonymous'}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          user.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-slate-500/10 text-slate-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className={`text-xs font-semibold ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Status Distribution</h2>
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.count} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Timeline (14 days)</h2>
              <div className="flex h-28 items-end gap-1">
                {timeline.map((item) => (
                  <div key={item._id} className="group relative flex-1">
                    <div
                      className="rounded-t bg-blue-600/30 transition hover:bg-blue-600"
                      style={{ height: `${Math.max(8, (item.count / maxTimelineCount) * 100)}%` }}
                    />
                    <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white group-hover:block">
                      {item.count} jobs
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Recent processing trend from backend timeline endpoint.</p>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
