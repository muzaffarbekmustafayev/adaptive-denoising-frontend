'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/lib/api';

type AuditLog = {
  at: string;
  type: 'USER' | 'JOB' | 'API_KEY';
  action: string;
  target: string;
};

export default function AdminAuditSecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await adminApi.getAuditLogs(100);
    setLogs(res.data.data || []);
  };

  useEffect(() => {
    const run = async () => {
      await load();
      setLoading(false);
    };
    run();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Audit & Security</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">User, job va API key faoliyatlari jurnali.</p>
          </div>
          <button onClick={load} className="btn-secondary px-3 py-2 text-sm">Refresh</button>
        </div>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading logs...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log, idx) => (
                  <tr key={`${log.at}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4 text-slate-500">{new Date(log.at).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{log.action}</td>
                    <td className="px-5 py-4">{log.target}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      Audit loglar topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
