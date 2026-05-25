'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { deviceApi, type Device } from '@/lib/api';
import { FiCpu, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', type: 'WEB_APP' });

  const loadDevices = async () => {
    const response = await deviceApi.list();
    setDevices(response.data.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadDevices();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load devices');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      await deviceApi.create({ name: form.name.trim(), type: form.type });
      setForm({ name: '', type: 'WEB_APP' });
      await loadDevices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create device');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deviceApi.delete(id);
      setDevices((prev) => prev.filter((item) => item._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete device');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Devices</h1>
            <p className="text-sm text-slate-500">Manage connected audio devices for your account.</p>
          </div>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="card p-5 lg:col-span-1">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Add Device</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="modern-input"
                placeholder="Studio Mic 01"
                maxLength={100}
                required
              />
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className="modern-input"
              >
                <option value="WEB_APP">Web App</option>
                <option value="RASPBERRY_PI">Raspberry Pi</option>
                <option value="ESP32_GATEWAY">ESP32 Gateway</option>
                <option value="ROBOT">Robot</option>
                <option value="OTHER">Other</option>
              </select>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                <FiPlus className="h-4 w-4" />
                {saving ? 'Saving...' : 'Create Device'}
              </button>
            </form>
          </section>

          <section className="card overflow-hidden lg:col-span-2">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="font-semibold text-slate-900 dark:text-white">Registered Devices</h2>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">No devices added yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {devices.map((device) => (
                  <div key={device._id} className="flex items-center justify-between px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{device.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{device.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {device.status}
                      </span>
                      <button
                        onClick={() => handleDelete(device._id)}
                        className="rounded border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                        title="Delete device"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
              <FiCpu className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Devices route is now linked with backend endpoints and can be extended with edit/status toggles anytime.
            </p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
