'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import { audioApi, type AudioJob } from '@/lib/api';
import {
  FiBriefcase,
  FiDownload,
  FiLoader,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiInbox,
} from 'react-icons/fi';

type StatusFilter = 'ALL' | AudioJob['status'];

const STATUS_FILTERS: StatusFilter[] = ['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];

const statusBadge: Record<AudioJob['status'], string> = {
  QUEUED:     'bg-amber-500/10 text-amber-600 border-amber-400/20 dark:text-amber-400',
  PROCESSING: 'bg-blue-500/10 text-blue-600 border-blue-400/20 dark:text-blue-400 animate-pulse',
  COMPLETED:  'bg-emerald-500/10 text-emerald-600 border-emerald-400/20 dark:text-emerald-400',
  FAILED:     'bg-red-500/10 text-red-600 border-red-400/20 dark:text-red-400',
  CANCELLED:  'bg-slate-200 text-slate-500 border-slate-300/30 dark:bg-slate-800 dark:text-slate-400',
};

function formatFileSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<AudioJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  // Per-action loading: map of jobId -> action name
  const [busy, setBusy] = useState<Record<string, string>>({});
  const { toasts, removeToast, success, error: toastError } = useToast();

  const loadJobs = async () => {
    const res = await audioApi.getMyJobs();
    setJobs(res.data.data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadJobs();
      } catch (err: any) {
        toastError('Failed to load jobs', err.response?.data?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setBusyFor = (id: string, action: string) =>
    setBusy((prev) => ({ ...prev, [id]: action }));

  const clearBusy = (id: string) =>
    setBusy((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const handleRetry = async (job: AudioJob) => {
    if (busy[job._id]) return;
    setBusyFor(job._id, 'retry');
    try {
      await audioApi.retryJob(job._id);
      await loadJobs();
      success('Job requeued', `"${job.originalFileName}" has been queued again.`);
    } catch (err: any) {
      toastError('Retry failed', err.response?.data?.message || 'Could not retry the job.');
    } finally {
      clearBusy(job._id);
    }
  };

  const handleCancel = async (job: AudioJob) => {
    if (busy[job._id]) return;
    setBusyFor(job._id, 'cancel');
    try {
      await audioApi.cancelJob(job._id);
      await loadJobs();
      success('Job cancelled', `"${job.originalFileName}" has been cancelled.`);
    } catch (err: any) {
      toastError('Cancel failed', err.response?.data?.message || 'Could not cancel the job.');
    } finally {
      clearBusy(job._id);
    }
  };

  const handleDelete = async (job: AudioJob) => {
    if (busy[job._id]) return;
    if (!confirm(`Delete "${job.originalFileName}" permanently?`)) return;
    setBusyFor(job._id, 'delete');
    try {
      await audioApi.deleteJob(job._id);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      success('Job deleted', `"${job.originalFileName}" has been removed.`);
    } catch (err: any) {
      toastError('Delete failed', err.response?.data?.message || 'Could not delete the job.');
    } finally {
      clearBusy(job._id);
    }
  };

  const handleDownload = async (job: AudioJob) => {
    if (busy[job._id]) return;
    setBusyFor(job._id, 'download');
    try {
      const res = await audioApi.downloadOutput(job._id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `denoised_${job.originalFileName || 'audio'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      success('Download started', `Denoised file is downloading.`);
    } catch (err: any) {
      toastError('Download failed', err.response?.data?.message || 'Could not download the file.');
    } finally {
      clearBusy(job._id);
    }
  };

  const filtered = useMemo(
    () => (filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter]
  );

  const counts = useMemo(
    () =>
      jobs.reduce(
        (acc, j) => ({ ...acc, [j.status]: (acc[j.status] || 0) + 1 }),
        {} as Record<string, number>
      ),
    [jobs]
  );

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <FiBriefcase className="h-7 w-7 text-primary" />
              Jobs Manager
            </h1>
            <p className="mt-1 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
              {jobs.length} total jobs &bull; {counts.PROCESSING || 0} processing
            </p>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              try { await loadJobs(); } catch { /* silent */ } finally { setLoading(false); }
            }}
            className="btn-secondary px-4 py-2 text-sm font-bold self-start sm:self-auto"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl border px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                filter === s
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {s}
              {s !== 'ALL' && counts[s] ? (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">{counts[s]}</span>
              ) : null}
              {s === 'ALL' && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">{jobs.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div className="card overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <FiLoader className="h-6 w-6 animate-spin" />
              <span className="text-sm font-bold">Loading jobs...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="h-16 w-16 rounded-3xl bg-muted grid place-items-center mb-4">
                <FiInbox className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="font-bold text-foreground">No jobs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'ALL'
                  ? 'Submit your first audio file from the Denoising page.'
                  : `No ${filter.toLowerCase()} jobs right now.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-border/50 bg-muted/30">
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    <th className="px-6 py-4">File</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Input</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((job) => {
                    const action = busy[job._id];
                    const isBusy = Boolean(action);
                    return (
                      <tr key={job._id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 max-w-[220px]">
                          <span className="font-bold text-foreground truncate block" title={job.originalFileName}>
                            {job.originalFileName}
                          </span>
                          {job.qualityMetrics?.snrImprovementDb && (
                            <span className="text-[10px] font-bold text-emerald-500">
                              +{job.qualityMetrics.snrImprovementDb} dB SNR
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusBadge[job.status]}`}>
                            {job.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground font-bold">
                          {formatFileSize(job.inputBytes)}
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground font-bold">
                          {formatDate(job.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {/* Download */}
                            {job.status === 'COMPLETED' && (
                              <ActionBtn
                                onClick={() => handleDownload(job)}
                                busy={action === 'download'}
                                disabled={isBusy}
                                title="Download result"
                                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/40"
                              >
                                {action === 'download' ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiDownload className="h-4 w-4" />}
                              </ActionBtn>
                            )}

                            {/* Retry */}
                            {(job.status === 'FAILED' || job.status === 'COMPLETED') && (
                              <ActionBtn
                                onClick={() => handleRetry(job)}
                                busy={action === 'retry'}
                                disabled={isBusy}
                                title="Retry job"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                              >
                                {action === 'retry' ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiRefreshCw className="h-4 w-4" />}
                              </ActionBtn>
                            )}

                            {/* Cancel */}
                            {(job.status === 'QUEUED' || job.status === 'PROCESSING') && (
                              <ActionBtn
                                onClick={() => handleCancel(job)}
                                busy={action === 'cancel'}
                                disabled={isBusy}
                                title="Cancel job"
                                className="border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950/40"
                              >
                                {action === 'cancel' ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiX className="h-4 w-4" />}
                              </ActionBtn>
                            )}

                            {/* Delete */}
                            <ActionBtn
                              onClick={() => handleDelete(job)}
                              busy={action === 'delete'}
                              disabled={isBusy}
                              title="Delete job"
                              className="border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                            >
                              {action === 'delete' ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ActionBtn({
  children,
  onClick,
  busy,
  disabled,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  title: string;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-9 w-9 place-items-center rounded-xl border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
