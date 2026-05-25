'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email: email.trim(), password });
      const token = res.data.data.token;
      localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-slate-900 dark:text-white">
            Denoise.AI
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Login</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Hisobingizga kirish uchun ma&apos;lumotlaringizni kiriting.
          </p>
        </div>

        <div className="card p-6 md:p-8">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modern-input"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Parol
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modern-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                'Kirilmoqda...'
              ) : (
                'Kirish'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Akkountingiz yo&apos;qmi?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
