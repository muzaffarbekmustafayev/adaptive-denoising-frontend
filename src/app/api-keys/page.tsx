'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiKeyApi, type ApiKey } from '@/lib/api';
import {
  FiAlertCircle,
  FiCheck,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiKey,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiTrash2,
} from 'react-icons/fi';

type RevealedKeys = Record<string, string>;

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<RevealedKeys>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const activeCount = useMemo(() => keys.filter((key) => key.isActive).length, [keys]);
  const totalUsage = useMemo(() => keys.reduce((sum, key) => sum + key.usageCount, 0), [keys]);

  const loadKeys = async () => {
    const response = await apiKeyApi.list();
    setKeys(response.data.data);
  };

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        await loadKeys();
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
          return;
        }
        setError(err.response?.data?.message || 'API keys could not be loaded');
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, [router]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const writeClipboard = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const copyToClipboard = async (keyId: string, value: string) => {
    await writeClipboard(value);
    setCopiedKeyId(keyId);
    window.setTimeout(() => setCopiedKeyId(null), 1800);
  };

  const handleCreateKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const response = await apiKeyApi.create(newKeyName.trim(), monthlyLimit);
      const createdKey = response.data.data;
      setRevealedKeys((current) => ({ ...current, [createdKey._id]: createdKey.key }));
      setNewKeyName('');
      setMonthlyLimit(1000);
      setIsCreateModalOpen(false);
      await loadKeys();
      await copyToClipboard(createdKey._id, createdKey.key);
      showNotice('New API key created and copied');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevealAndCopy = async (key: ApiKey) => {
    setBusyKeyId(key._id);
    setError('');

    try {
      const currentValue = revealedKeys[key._id];
      if (currentValue) {
        await copyToClipboard(key._id, currentValue);
        showNotice('API key copied');
        return;
      }

      const response = await apiKeyApi.reveal(key._id);
      const fullKey = response.data.data.key;
      setRevealedKeys((current) => ({ ...current, [key._id]: fullKey }));
      await copyToClipboard(key._id, fullKey);
      showNotice('API key revealed and copied');
    } catch (err: any) {
      if (err.response?.status === 409) {
        await handleRegenerateAndCopy(key);
        return;
      }
      setError(err.response?.data?.message || 'This API key cannot be copied');
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleRegenerateAndCopy = async (key: ApiKey) => {
    const confirmed = window.confirm(`Regenerate "${key.name}"? The old API key value will stop working.`);
    if (!confirmed) return;

    setBusyKeyId(key._id);
    setError('');

    try {
      const response = await apiKeyApi.regenerate(key._id);
      const regeneratedKey = response.data.data.key;
      setRevealedKeys((current) => ({ ...current, [key._id]: regeneratedKey }));
      await copyToClipboard(key._id, regeneratedKey);
      await loadKeys();
      showNotice('API key regenerated and copied');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate API key');
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    setBusyKeyId(key._id);
    setError('');

    try {
      if (key.isActive) {
        await apiKeyApi.deactivate(key._id);
        showNotice('API key deactivated');
      } else {
        await apiKeyApi.activate(key._id);
        showNotice('API key activated');
      }
      await loadKeys();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update API key status');
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleDeleteKey = async (key: ApiKey) => {
    const confirmed = window.confirm(`Delete "${key.name}" permanently?`);
    if (!confirmed) return;

    setBusyKeyId(key._id);
    setError('');

    try {
      await apiKeyApi.delete(key._id);
      setKeys((current) => current.filter((item) => item._id !== key._id));
      setRevealedKeys((current) => {
        const next = { ...current };
        delete next[key._id];
        return next;
      });
      showNotice('API key deleted');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete API key');
    } finally {
      setBusyKeyId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const maskedKey = (key: ApiKey) => `${key.keyPrefix}****************`;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-12 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              <FiShield className="h-3.5 w-3.5" />
              API Access
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">API Keys</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
              Create keys for backend integrations, copy available keys, and temporarily disable access without deleting credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError('');
              setIsCreateModalOpen(true);
            }}
            className="btn-primary min-h-10"
          >
            <FiPlus className="h-4 w-4" />
            Create API Key
          </button>
        </header>

        {(notice || error) && (
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-bold ${
              error
                ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {error ? <FiAlertCircle className="h-5 w-5" /> : <FiCheck className="h-5 w-5" />}
            {error || notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="stat-card">
            <span className="stat-label">Total Keys</span>
            <span className="stat-value">{keys.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Keys</span>
            <span className="stat-value">{activeCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">API Requests</span>
            <span className="stat-value">{totalUsage.toLocaleString()}</span>
          </div>
        </div>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Credentials</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Inactive keys cannot access API key protected backend routes.</p>
          </div>

          {keys.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FiKey className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg font-black text-slate-900 dark:text-white">No API keys yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create one to connect an external client.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {keys.map((key) => {
                const usagePercent = Math.min((key.usageCount / key.monthlyLimit) * 100, 100);
                const isBusy = busyKeyId === key._id;

                return (
                  <article key={key._id} className="px-6 py-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{key.name}</h3>
                          <span
                            className={`rounded-md px-2 py-1 text-xs font-black uppercase tracking-widest ${
                              key.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {key.canReveal === false && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Regeneration required
                            </span>
                          )}
                        </div>

                        <code className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 break-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                          {maskedKey(key)}
                        </code>

                        <div className="mt-4 grid grid-cols-1 gap-4 text-xs font-bold uppercase tracking-widest text-slate-500 sm:grid-cols-3">
                          <span>Created {formatDate(key.createdAt)}</span>
                          <span>Last used {formatDate(key.lastUsedAt)}</span>
                          <span>{key.usageCount.toLocaleString()} / {key.monthlyLimit.toLocaleString()}</span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full ${key.isActive ? 'bg-blue-600' : 'bg-slate-400'}`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-500/40 hover:text-blue-600 dark:border-slate-800 dark:text-slate-300"
                          onClick={() => key.canReveal === false ? handleRegenerateAndCopy(key) : handleRevealAndCopy(key)}
                          disabled={isBusy}
                          title={key.canReveal === false ? 'Regenerate and copy a new API key' : 'Copy API key'}
                        >
                          {copiedKeyId === key._id ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                          {copiedKeyId === key._id ? 'Copied' : key.canReveal === false ? 'Regenerate & Copy' : 'Copy'}
                        </button>

                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-500/40 hover:text-amber-600 dark:border-slate-800 dark:text-slate-300"
                          onClick={() => handleToggleKey(key)}
                          disabled={isBusy}
                        >
                          {key.isActive ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                          {key.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-500/10"
                          onClick={() => handleDeleteKey(key)}
                          disabled={isBusy}
                        >
                          {isBusy ? <FiSlash className="h-4 w-4" /> : <FiTrash2 className="h-4 w-4" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-8">
            <button
              type="button"
              aria-label="Close create API key modal"
              className="absolute inset-0 cursor-default"
              onClick={() => !creating && setIsCreateModalOpen(false)}
            />
            <div className="card relative z-10 w-full max-w-lg overflow-hidden shadow-lg">
              <div className="flex items-start justify-between border-b border-border bg-muted px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create API Key</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Create a credential for an application, device, or integration.</p>
                </div>
                <button
                  type="button"
                  onClick={() => !creating && setIsCreateModalOpen(false)}
                  className="rounded border border-border px-2 py-1 text-sm font-semibold text-muted-foreground hover:bg-background"
                  disabled={creating}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateKey} className="space-y-5 p-5">
                {error && (
                  <div className="flex items-center gap-3 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400">
                    <FiAlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">Key name</span>
                  <input
                    className="modern-input"
                    value={newKeyName}
                    maxLength={80}
                    onChange={(event) => setNewKeyName(event.target.value)}
                    placeholder="Production app, mobile client, CI pipeline"
                    autoFocus
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">Monthly request limit</span>
                  <input
                    className="modern-input"
                    type="number"
                    min={1}
                    value={monthlyLimit}
                    onChange={(event) => setMonthlyLimit(Math.max(1, Number(event.target.value) || 1))}
                    required
                  />
                </label>

                <div className="rounded border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                  The key value is not shown on screen. It will be copied automatically after creation.
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn-secondary min-h-10 px-4 text-sm font-semibold"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button className="btn-primary min-h-10" disabled={creating || !newKeyName.trim()} type="submit">
                    {creating ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiPlus className="h-4 w-4" />}
                    {creating ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
