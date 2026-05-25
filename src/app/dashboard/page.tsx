'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiKeyApi, type ApiKey } from '@/lib/api';
import { useUser } from '@/lib/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastContainer, useToast } from '@/components/Toast';
import {
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiKey,
  FiPlus,
  FiPower,
  FiTrash2,
  FiShield,
  FiLoader,
} from 'react-icons/fi';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const { toasts, removeToast, success, error: toastError } = useToast();

  const loadKeys = async () => {
    const res = await apiKeyApi.list();
    setKeys(res.data.data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadKeys();
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
          return;
        }
        toastError('Failed to load API keys', err.response?.data?.message || 'Unknown error');
      } finally {
        setKeysLoading(false);
      }
    })();
  }, [router]);

  const handleCreateKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const response = await apiKeyApi.create(newKeyName.trim());
      const createdKey = response.data.data;
      setNewApiKey(createdKey.key);
      setNewKeyName('');
      await loadKeys();
      success('API key created', 'Copy the key now — it will not be shown again.');
    } catch (err: any) {
      toastError('Create failed', err.response?.data?.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    try {
      if (key.isActive) {
        await apiKeyApi.deactivate(key._id);
        success('Key deactivated', `"${key.name}" is now inactive.`);
      } else {
        await apiKeyApi.activate(key._id);
        success('Key activated', `"${key.name}" is now active.`);
      }
      await loadKeys();
    } catch (err: any) {
      toastError('Update failed', err.response?.data?.message || 'Failed to update API key');
    }
  };

  const handleDeleteKey = async (key: ApiKey) => {
    if (!confirm(`Delete "${key.name}" permanently?`)) return;
    try {
      await apiKeyApi.delete(key._id);
      setKeys((current) => current.filter((item) => item._id !== key._id));
      success('Key deleted', `"${key.name}" has been removed.`);
    } catch (err: any) {
      toastError('Delete failed', err.response?.data?.message || 'Failed to delete API key');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    window.setTimeout(() => setCopiedKey(false), 1800);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const totalRequests = keys.reduce((sum, key) => sum + key.usageCount, 0);
  const activeKeys = keys.filter((key) => key.isActive).length;

  if (userLoading || keysLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-96 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
            <p className="mt-1 text-sm font-bold text-slate-500/70 dark:text-slate-400/60 uppercase tracking-widest">
              Welcome back, {user?.fullName || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/api-keys')} className="btn-secondary px-5 py-2.5 text-sm font-bold">
              <FiKey className="h-4 w-4" />
              Manage Keys
            </button>
            <button onClick={() => router.push('/denoise')} className="btn-primary px-5 py-2.5 text-sm font-bold shadow-lg shadow-primary/20">
              New Denoise Job
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* New key banner */}
        {newApiKey && (
          <div className="card border-primary/30 bg-primary/5 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 bg-primary/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:bg-primary/20 transition-all" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">API key generated</h2>
                  <p className="text-sm font-medium text-slate-500">Copy this key now — for security, it cannot be shown again.</p>
                </div>
                <button onClick={() => setNewApiKey(null)} className="h-8 w-8 grid place-items-center rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all">
                  <FiTrash2 className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <code className="min-w-0 flex-1 rounded-xl border border-primary/20 bg-white/50 dark:bg-slate-950/50 px-4 py-3 text-sm font-mono font-bold break-all shadow-inner">
                  {newApiKey}
                </code>
                <button onClick={() => copyToClipboard(newApiKey)} className="btn-primary px-6 py-3 text-sm font-bold">
                  {copiedKey ? <FiCheck className="h-5 w-5" /> : <FiCopy className="h-5 w-5" />}
                  {copiedKey ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard icon={<FiActivity className="h-6 w-6" />} label="Total Requests" value={totalRequests.toLocaleString()} color="blue" />
          <StatCard icon={<FiKey className="h-6 w-6" />} label="Active Credentials" value={String(activeKeys)} color="indigo" />
          <StatCard icon={<FiCheck className="h-6 w-6" />} label="Account Status" value={user?.status || 'ACTIVE'} color="emerald" />
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Keys Table */}
          <section className="card overflow-hidden xl:col-span-2 flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Active Credentials</h2>
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Recent authentication keys</p>
              </div>
              <button onClick={() => router.push('/api-keys')} className="text-xs font-black text-primary uppercase tracking-[0.2em] hover:underline">
                View All
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-16 w-16 rounded-3xl bg-muted grid place-items-center mb-4">
                  <FiKey className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-bold text-foreground">No API keys</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Create your first key to integrate the denoising engine.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="border-b border-border/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Prefix</th>
                      <th className="px-6 py-4">Usage / Limit</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {keys.slice(0, 5).map((key) => (
                      <tr key={key._id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground tracking-tight">{key.name}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`h-1.5 w-1.5 rounded-full ${key.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                {key.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-muted-foreground/80 border border-border/50">
                            {key.keyPrefix}...
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-foreground">{key.usageCount.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-muted-foreground/50">/ {key.monthlyLimit.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${key.usageCount / key.monthlyLimit > 0.8 ? 'bg-amber-500' : 'bg-primary'}`}
                                style={{ width: `${Math.min(100, (key.usageCount / key.monthlyLimit) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggleKey(key)}
                              className="h-9 w-9 grid place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                              title={key.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <FiPower className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteKey(key)}
                              className="h-9 w-9 grid place-items-center rounded-xl border border-border bg-card text-danger/70 hover:bg-danger/10 hover:text-danger transition-all"
                              title="Delete"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            <section className="card p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <FiPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground tracking-tight">Create Key</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Generate API Token</p>
                </div>
              </div>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Key Label</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="modern-input w-full px-4 py-3 rounded-xl bg-card"
                    placeholder="e.g. Production App"
                    maxLength={80}
                    required
                  />
                </div>
                <button type="submit" disabled={creating || !newKeyName.trim()} className="btn-primary w-full py-3 font-bold shadow-lg shadow-primary/10">
                  {creating ? (
                    <span className="flex items-center gap-2 justify-center">
                      <FiLoader className="h-4 w-4 animate-spin" /> Creating...
                    </span>
                  ) : 'Generate New Key'}
                </button>
              </form>
            </section>

            <section className="card p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <FiShield className="h-24 w-24" />
              </div>
              <h2 className="mb-6 font-bold text-foreground tracking-tight flex items-center gap-2">
                <FiShield className="text-primary h-4 w-4" />
                Security Audit
              </h2>
              <div className="space-y-4 relative z-10">
                <InfoRow label="Identity" value={user?.fullName || '—'} />
                <InfoRow label="Access Level" value={user?.role || '—'} />
                <InfoRow label="Member Since" value={formatDate(user?.createdAt)} />
                <div className="pt-2">
                  <button onClick={() => router.push('/profile')} className="w-full py-2.5 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted transition-all">
                    View Security Profile
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'blue' | 'indigo' | 'emerald' }) {
  const colorMap = {
    blue:    'text-blue-600 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
    indigo:  'text-indigo-600 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5',
    emerald: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
  };
  return (
    <div className="card p-6 flex items-start gap-5 group hover:border-primary/30 transition-all cursor-default">
      <div className={`p-4 rounded-2xl border transition-all group-hover:scale-110 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{label}</span>
        <span className="text-2xl font-black text-foreground tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-foreground tracking-tight">{value}</span>
    </div>
  );
}
