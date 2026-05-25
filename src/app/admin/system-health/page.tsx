'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/lib/api';

type Health = {
  service: string;
  uptimeSeconds: number;
  memoryMb: number;
  totalUsers: number;
  blockedUsers: number;
  totalJobs: number;
  activeKeys: number;
  failedJobs: number;
  timestamp: string;
};

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<Health | null>(null);

  const load = async () => {
    const res = await adminApi.getSystemHealth();
    setHealth(res.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">System Health</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Server holati va asosiy tizim ko&apos;rsatkichlari.</p>
          </div>
          <button onClick={load} className="btn-secondary px-3 py-2 text-sm">Refresh</button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Tile label="Service" value={health?.service || '-'} />
          <Tile label="Uptime" value={`${health?.uptimeSeconds || 0}s`} />
          <Tile label="Memory" value={`${health?.memoryMb || 0} MB`} />
          <Tile label="Failed Jobs" value={String(health?.failedJobs || 0)} />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Detailed Metrics</h2>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
            <p>Total Users: {health?.totalUsers || 0}</p>
            <p>Blocked Users: {health?.blockedUsers || 0}</p>
            <p>Total Jobs: {health?.totalJobs || 0}</p>
            <p>Active API Keys: {health?.activeKeys || 0}</p>
          </div>
          <p className="mt-4 text-xs text-slate-500">Last update: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '-'}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
