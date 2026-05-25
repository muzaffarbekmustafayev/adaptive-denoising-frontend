'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function EngineSettingsPage() {
  const [defaultMode, setDefaultMode] = useState('basic');
  const [autoRetry, setAutoRetry] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const mode = localStorage.getItem('engine.defaultMode');
    const retry = localStorage.getItem('engine.autoRetry');
    if (mode) setDefaultMode(mode);
    if (retry) setAutoRetry(retry === 'true');
  }, []);

  const save = () => {
    localStorage.setItem('engine.defaultMode', defaultMode);
    localStorage.setItem('engine.autoRetry', String(autoRetry));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Engine Settings</h1>
        <div className="card p-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Default Denoise Mode</label>
            <select value={defaultMode} onChange={(e) => setDefaultMode(e.target.value)} className="modern-input">
              <option value="basic">Basic</option>
              <option value="aggressive">Aggressive</option>
              <option value="gentle">Gentle</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRetry} onChange={(e) => setAutoRetry(e.target.checked)} />
            Auto-retry failed jobs
          </label>
          <button onClick={save} className="btn-primary">{saved ? 'Saved' : 'Save Settings'}</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
