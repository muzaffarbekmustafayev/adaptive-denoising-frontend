'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { audioApi, type AudioJob } from '@/lib/api';

export default function ReportsPage() {
  const [jobs, setJobs] = useState<AudioJob[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await audioApi.getMyJobs();
      setJobs(res.data.data || []);
    };
    run();
  }, []);

  const summary = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter((j) => j.status === 'COMPLETED').length;
    const failed = jobs.filter((j) => j.status === 'FAILED').length;
    return { total, completed, failed };
  }, [jobs]);

  const exportCsv = () => {
    const rows = [
      ['CreatedAt', 'File', 'Status', 'InputBytes', 'OutputBytes'],
      ...jobs.map((j) => [j.createdAt, j.originalFileName, j.status, String(j.inputBytes || 0), String(j.outputBytes || 0)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `denoise-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Info label="Total Jobs" value={String(summary.total)} />
          <Info label="Completed" value={String(summary.completed)} />
          <Info label="Failed" value={String(summary.failed)} />
        </div>
        <button onClick={exportCsv} className="btn-primary">Export CSV</button>
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
