'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiKeyApi, audioApi, type ApiKey, type AudioJob } from '@/lib/api';

type AuditItem = { at: string; actor: string; action: string; target: string };

export default function AuditLogsPage() {
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

  const items = useMemo<AuditItem[]>(() => {
    const jobItems = jobs.slice(0, 20).map((job) => ({
      at: job.updatedAt || job.createdAt,
      actor: 'USER',
      action: `JOB_${job.status}`,
      target: job.originalFileName || job._id,
    }));
    const keyItems = keys.slice(0, 20).map((key) => ({
      at: key.updatedAt || key.createdAt,
      actor: 'USER',
      action: key.isActive ? 'API_KEY_ACTIVE' : 'API_KEY_INACTIVE',
      target: key.name,
    }));
    return [...jobItems, ...keyItems].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 30);
  }, [jobs, keys]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <tr key={`${item.at}-${idx}`}>
                  <td className="px-5 py-4 text-slate-500">{new Date(item.at).toLocaleString()}</td>
                  <td className="px-5 py-4">{item.actor}</td>
                  <td className="px-5 py-4 font-semibold">{item.action}</td>
                  <td className="px-5 py-4">{item.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
