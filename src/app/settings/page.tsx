'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiBell, FiCpu, FiMonitor, FiSettings, FiShield } from 'react-icons/fi';
import { useTheme } from '@/components/ThemeProvider';

// Helper function to get from localStorage or use default
const getSetting = (key: string, defaultValue: any) => {
  if (typeof window !== 'undefined') {
    const savedValue = localStorage.getItem(key);
    return savedValue !== null ? JSON.parse(savedValue) : defaultValue;
  }
  return defaultValue;
};

// Helper function to save to localStorage
const saveSetting = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export default function SettingsPage() {
  const { theme, themePreference, setThemePreference } = useTheme();
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [autoDenoise, setAutoDenoise] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    setLanguage(getSetting('settings.language', 'en'));
    setNotifications(getSetting('settings.notifications', true));
    setAutoDenoise(getSetting('settings.autoDenoise', false));
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleNotificationsChange = () => {
    setNotifications((prev) => !prev);
  };

  const handleAutoDenoiseChange = () => {
    setAutoDenoise((prev) => !prev);
  };

  const handleSaveGeneralSettings = () => {
    saveSetting('settings.language', language);
    alert('General settings saved!'); // Or use a toast notification
  };

  const handleSaveNotificationSettings = () => {
    saveSetting('settings.notifications', notifications);
    alert('Notification settings saved!'); // Or use a toast notification
  };

  const handleSaveProcessingSettings = () => {
    saveSetting('settings.autoDenoise', autoDenoise);
    alert('Processing settings saved!'); // Or use a toast notification
  };

  // Toggle theme function is already part of useTheme, assuming it handles persistence internally
  const toggleTheme = () => {
    // This function should ideally be part of useTheme hook and handle its own persistence
    // For now, we'll assume useTheme handles it. If not, it would need similar localStorage logic.
    // For demonstration, let's assume theme preference is handled by useTheme
    const newPreference = theme === 'light' ? 'dark' : 'light';
    setThemePreference(newPreference);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform sozlamalarini klassik boshqaruv panel ko&apos;rinishida sozlang.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiSettings className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">General</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                <div className="flex items-center gap-3">
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="modern-input flex-grow"
                  >
                    <option value="en">English (US)</option>
                    <option value="uz">O&apos;zbekcha</option>
                    <option value="ru">Русский</option>
                  </select>
                  <button onClick={handleSaveGeneralSettings} className="btn-primary px-4 py-2 text-sm">Save</button>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiMonitor className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Theme mode</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Current theme: {theme}</p>
                </div>
                <button onClick={toggleTheme} className="btn-secondary px-3 py-2 text-sm">
                  {theme === 'light' ? 'Use dark' : 'Use light'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ] as const).map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setThemePreference(item.value)}
                    className={`rounded border px-3 py-2 text-sm font-medium ${
                      themePreference === item.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiBell className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h2>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Email alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Muhim hodisalar bo&apos;yicha xabarnoma</p>
              </div>
              <button
                onClick={handleNotificationsChange}
                className={`rounded border px-3 py-1 text-xs font-semibold ${
                  notifications
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                {notifications ? 'Enabled' : 'Disabled'}
              </button>
            </div>
             <button onClick={handleSaveNotificationSettings} className="btn-primary mt-4 w-full py-2 text-sm">Save Notification Settings</button>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiCpu className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Processing</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Auto denoise</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Yangi uploadlarda avtomatik ishga tushirish</p>
                </div>
                <button
                  onClick={handleAutoDenoiseChange}
                  className={`rounded border px-3 py-1 text-xs font-semibold ${
                    autoDenoise
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  {autoDenoise ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <button className="btn-secondary w-full py-2 text-sm">Reset processing cache</button>
            </div>
            <button onClick={handleSaveProcessingSettings} className="btn-primary mt-4 w-full py-2 text-sm">Save Processing Settings</button>
          </section>

          <section className="card p-5 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <FiShield className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Security</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
              <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                Session timeout: 30 min
              </div>
              <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                API key rotation: Enabled
              </div>
              <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                Last policy update: 2026-04-30
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

