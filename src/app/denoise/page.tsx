'use client';

import { useState, useEffect, useRef } from 'react';
import { audioApi, type AudioJob, type AudioMode } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import {
  FiUploadCloud,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiMusic,
  FiDownload,
  FiInfo,
  FiActivity,
  FiZap,
  FiLoader,
  FiMic,
} from 'react-icons/fi';

const MODES: { value: AudioMode; label: string; description: string }[] = [
  { value: 'basic',      label: 'Standard Optimization', description: 'Balanced noise reduction for most recordings' },
  { value: 'gentle',     label: 'Studio Preservation',   description: 'Subtle cleaning to preserve natural dynamics' },
  { value: 'aggressive', label: 'Extreme Filtration',     description: 'Maximum noise removal for heavily degraded audio' },
  { value: 'voice',      label: 'Voice Enhancement',      description: 'Optimized for speech: de-essing + EQ boost' },
];

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function DenoisePage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<AudioMode>('basic');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<AudioJob | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toasts, removeToast, success, error: toastError } = useToast();

  // Animated progress bar
  useEffect(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }

    if (!job) { setProgress(0); return; }
    if (job.status === 'COMPLETED') { setProgress(100); return; }
    if (job.status === 'FAILED' || job.status === 'CANCELLED') { return; }
    if (job.status === 'QUEUED') { setProgress(12); return; }

    // PROCESSING: slowly crawl toward 90%
    if (job.status === 'PROCESSING') {
      setProgress((prev) => (prev < 20 ? 20 : prev));
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (90 - prev) * 0.04;
          return next > 89 ? 89 : next;
        });
      }, 600);
    }

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [job?.status]);

  // Job polling
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let delay = 1200;

    if (jobId && job?.status && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
      const poll = async () => {
        try {
          const res = await audioApi.getJobStatus(jobId);
          const updated: AudioJob = res.data.data;
          setJob(updated);

          if (updated.status === 'COMPLETED') {
            success('Processing complete', 'Your audio is ready to download.');
          } else if (updated.status === 'FAILED') {
            toastError('Processing failed', updated.errorMessage || 'An error occurred.');
          } else {
            delay = Math.min(delay * 1.25, 12000);
            timer = setTimeout(poll, delay);
          }
        } catch {
          timer = setTimeout(poll, delay);
        }
      };
      timer = setTimeout(poll, delay);
    }

    return () => clearTimeout(timer);
  }, [jobId, job?.status]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type.startsWith('audio/') || dropped?.type.startsWith('video/')) {
      setFile(dropped);
    } else {
      toastError('Invalid file type', 'Please select an audio file (MP3, WAV, FLAC, OGG, etc.)');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type.startsWith('audio/') || selected.type.startsWith('video/')) {
      setFile(selected);
    } else {
      toastError('Invalid file type', 'Please select an audio file (MP3, WAV, FLAC, OGG, etc.)');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setJob(null);
    setJobId(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await audioApi.denoise(formData, undefined, mode);
      const newJob = res.data.data;
      setJobId(newJob.jobId);
      setJob({
        _id: newJob.jobId,
        status: newJob.status,
        originalFileName: file.name,
        inputBytes: file.size,
        outputBytes: 0,
        durationSeconds: 0,
        userId: '',
        apiKeyId: null,
        inputPath: '',
        mimeType: file.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      toastError('Upload failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!jobId) return;
    try {
      const res = await audioApi.downloadOutput(jobId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `denoised_${file?.name || 'audio.mp3'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      success('Download started', 'Your denoised file is downloading.');
    } catch (err: any) {
      toastError('Download failed', err.response?.data?.message || 'Could not download the file.');
    }
  };

  const activeMode = MODES.find((m) => m.value === mode);
  const progressPct = Math.round(progress);

  const statusColor = {
    QUEUED:     'bg-amber-500/10 text-amber-500 border-amber-500/20',
    PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse',
    COMPLETED:  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    FAILED:     'bg-red-500/10 text-red-500 border-red-500/20',
    CANCELLED:  'bg-slate-500/10 text-slate-500 border-slate-500/20',
  } as Record<string, string>;

  const barColor = {
    QUEUED:     'bg-amber-500',
    PROCESSING: 'bg-blue-600',
    COMPLETED:  'bg-emerald-500 shadow-emerald-500/50',
    FAILED:     'bg-red-500 shadow-red-500/50',
    CANCELLED:  'bg-slate-400',
  } as Record<string, string>;

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="space-y-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            Neural Node Processing
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">
              V2.4 Active
            </div>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            High-Performance Spectral Noise Reduction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Main Action Area */}
          <div className="lg:col-span-3 space-y-10">
            <div className="card p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <FiMusic className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Source Integration</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select target audio stream</p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-10">
                {/* File Dropzone */}
                <div
                  className={`relative group border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="audio/*,video/webm"
                    className="hidden"
                    id="audio-upload"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer block">
                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 ${file ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-blue-500/10 text-blue-600'}`}>
                      {file ? <FiCheckCircle className="w-10 h-10" /> : <FiUploadCloud className="w-10 h-10" />}
                    </div>
                    {file ? (
                      <div className="space-y-2">
                        <p className="font-black text-slate-900 dark:text-white text-xl tracking-tight">{file.name}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          {formatFileSize(file.size)} &bull; READY FOR INJECTION
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Drop audio payload</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                          WAV / MP3 / MP4 / WEBM / OGG / FLAC / AAC
                          <br />
                          <span className="text-blue-500 opacity-60">Uplink capacity: 50 MB</span>
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Mode Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                      <FiSettings className="w-3.5 h-3.5" />
                      Neural Intensity
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as AudioMode)}
                      className="modern-input py-4 font-bold text-slate-900 dark:text-white border-2"
                    >
                      {MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex items-start gap-4">
                    {mode === 'voice' ? (
                      <FiMic className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                    ) : (
                      <FiInfo className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                      {activeMode?.description}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-5 text-base shadow-2xl shadow-blue-500/30 rounded-[1.5rem]"
                  disabled={loading || !file}
                >
                  {loading ? (
                    <div className="flex items-center gap-4 font-black uppercase tracking-widest">
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Initializing Core...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 font-black uppercase tracking-widest">
                      <FiZap className="w-5 h-5" />
                      Begin Neural Cleaning
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Status Column */}
          <div className="lg:col-span-2 space-y-10">
            <div className="card h-full flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[500px]">
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Pipeline Status</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time telemetry</p>
              </div>

              <div className="flex-1 flex flex-col p-10">
                {!job ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 grayscale group">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500">
                      <FiActivity className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Waiting for payload</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-2">Uplink inactive</p>
                  </div>
                ) : (
                  <div className="space-y-12 animate-fade-in">
                    {/* Progress Visual */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${statusColor[job.status] || statusColor.QUEUED}`}>
                          {job.status}
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800/50">
                        <div
                          style={{ width: `${progressPct}%` }}
                          className={`h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(59,130,246,0.5)] ${barColor[job.status] || 'bg-blue-600'}`}
                        />
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center py-5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Identity</span>
                        <span className="text-sm font-black truncate max-w-[180px] dark:text-white">{job.originalFileName}</span>
                      </div>
                      <div className="flex justify-between items-center py-5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Input Size</span>
                        <span className="text-sm font-black dark:text-white">{formatFileSize(job.inputBytes)}</span>
                      </div>
                      {job.qualityMetrics?.processingTimeMs && (
                        <div className="flex justify-between items-center py-5 border-b border-slate-100 dark:border-slate-800/50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Process Time</span>
                          <span className="text-sm font-black dark:text-white">{(job.qualityMetrics.processingTimeMs / 1000).toFixed(1)}s</span>
                        </div>
                      )}
                      {job.qualityMetrics?.snrImprovementDb && (
                        <div className="flex justify-between items-center py-5 border-b border-slate-100 dark:border-slate-800/50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SNR Improvement</span>
                          <span className="text-sm font-black text-emerald-500">+{job.qualityMetrics.snrImprovementDb} dB</span>
                        </div>
                      )}
                    </div>

                    {/* Action Area */}
                    <div className="pt-6">
                      {job.status === 'COMPLETED' ? (
                        <div className="space-y-6">
                          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-center gap-4 shadow-xl shadow-emerald-500/5">
                            <FiCheckCircle className="text-emerald-500 w-6 h-6 shrink-0" />
                            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                              Optimization complete. Output ready for extraction.
                            </p>
                          </div>
                          <button
                            onClick={handleDownload}
                            className="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-600/30 py-5 rounded-[1.5rem]"
                          >
                            <FiDownload className="w-6 h-6" />
                            <span className="font-black uppercase tracking-widest">Extract Result</span>
                          </button>
                        </div>
                      ) : job.status === 'FAILED' ? (
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] shadow-xl shadow-red-500/5">
                          <div className="flex items-center gap-3 mb-3 text-red-600">
                            <FiAlertCircle className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Algorithm Exception</span>
                          </div>
                          <p className="text-[11px] text-red-500 font-bold leading-relaxed uppercase opacity-80">
                            {job.errorMessage || 'Internal neural fault'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 py-6">
                          <FiLoader className="w-10 h-10 text-blue-600 animate-spin" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                            {job.status === 'QUEUED' ? 'Awaiting Queue Slot...' : 'Running Neural Cycles...'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
