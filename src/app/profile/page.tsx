'use client';

import { useState, useEffect } from 'react';
import { userApi, type User } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { FiAlertCircle, FiCheckCircle, FiLock, FiMail, FiShield, FiUser } from 'react-icons/fi';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userApi.getMe();
        setUser(res.data.data);
        setFullName(res.data.data.fullName || '');
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await userApi.updateProfile({ fullName });
      setUser(res.data.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setUpdatingPassword(true);
    setMessage({ type: '', text: '' });

    try {
      await userApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Password update failed' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Profil ma&apos;lumotlari va xavfsizlik sozlamalarini boshqaring.
          </p>
        </header>

        {message.text && (
          <div className={`rounded border px-4 py-3 text-sm flex items-center gap-2 ${
            message.type === 'success' 
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <FiCheckCircle className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FiUser className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Account Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="modern-input"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="modern-input pl-9 opacity-70"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Email hozircha o&apos;zgartirilmaydi.</p>
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="btn-primary w-full py-3"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FiLock className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Password & Security</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="modern-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="modern-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="modern-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-start gap-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <FiShield className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Parol o&apos;zgarsa, mavjud sessiyalarning bir qismi qayta autentifikatsiya talab qilishi mumkin.
                </p>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="btn-primary w-full py-3"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
