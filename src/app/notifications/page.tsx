'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { audioApi, apiKeyApi, type AudioJob, type ApiKey } from '@/lib/api';

export default function NotificationsPage() {
  const [jobs, setJobs] = useState<AudioJob[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    const run = async () => {
      const [jobsRes, keysRes] = await Promise.all([audioApi.getMyJobs(), apiKeyApi.list()]);
      setJobs(jobsRes.data.data || []);
      setKeys(keysRes.data.data || []);
    };
    run();
  }, []);

  const notifications = useMemo(() => {
    const failedJobs = jobs
      .filter((j) => j.status === 'FAILED')
      .slice(0, 5)
      .map((j) => ({ type: 'error', text: `Job failed: ${j.originalFileName}`, at: j.updatedAt || j.createdAt }));
    const completed = jobs
      .filter((j) => j.status === 'COMPLETED')
      .slice(0, 5)
      .map((j) => ({ type: 'success', text: `Job completed: ${j.originalFileName}`, at: j.updatedAt || j.createdAt }));
    const limits = keys
      .filter((k) => k.monthlyLimit > 0 && (k.usageCount / k.monthlyLimit) * 100 >= 80)
      .map((k) => ({ type: 'warning', text: `API key near limit: ${k.name}`, at: k.updatedAt || k.createdAt }));
    return [...failedJobs, ...completed, ...limits].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [jobs, keys]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div key={`${n.at}-${i}`} className="card p-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${n.type === 'error' ? 'text-red-600' : n.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {n.text}
                </span>
                <span className="text-xs text-slate-500">{new Date(n.at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
