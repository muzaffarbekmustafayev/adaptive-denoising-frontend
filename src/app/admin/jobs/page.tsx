'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/lib/api';

type AdminJob = {
  _id: string;
  originalFileName: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  userId?: { email?: string; fullName?: string };
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [status, setStatus] = useState<'ALL' | AdminJob['status']>('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await adminApi.getJobs(status === 'ALL' ? {} : { status, limit: 100 });
    setJobs(res.data.data || []);
  };

  useEffect(() => {
    const run = async () => {
      await load();
      setLoading(false);
    };
    run();
  }, [status]);

  const cancel = async (id: string) => {
    await adminApi.cancelJob(id);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Job Operations</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Queue va processing holatidagi ishlarni boshqarish.</p>
          </div>
          <div className="inline-flex rounded border border-slate-200 p-1 dark:border-slate-800">
            {(['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`rounded px-3 py-1 text-xs font-bold ${status === s ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading jobs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">File</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{job.originalFileName || job._id}</td>
                      <td className="px-5 py-4 text-slate-500">{job.userId?.email || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : job.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : job.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{new Date(job.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-4 text-right">
                        {(job.status === 'QUEUED' || job.status === 'PROCESSING') ? (
                          <button onClick={() => cancel(job._id)} className="rounded border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                            Force Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                        Bu filtr bo&apos;yicha ish topilmadi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
