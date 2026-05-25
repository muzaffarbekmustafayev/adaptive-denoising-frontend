'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi, type User } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'USER' as 'ADMIN' | 'USER',
    password: '',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    role: 'USER' as 'ADMIN' | 'USER',
    status: 'ACTIVE' as 'ACTIVE' | 'BLOCKED',
    password: '',
  });

  const load = async () => {
    const res = await adminApi.getUsers();
    setUsers(res.data.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const changeRole = async (userId: string, role: 'ADMIN' | 'USER') => {
    setError('');
    setSuccess('');
    setActionLoadingKey(`role-${userId}`);
    try {
      await adminApi.updateUserRole(userId, role);
      setSuccess(`User role changed to ${role}.`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change role');
    } finally {
      setActionLoadingKey('');
    }
  };

  const changeStatus = async (userId: string, status: 'ACTIVE' | 'BLOCKED') => {
    setError('');
    setSuccess('');
    setActionLoadingKey(`status-${userId}`);
    try {
      await adminApi.updateUserStatus(userId, status);
      setSuccess(`User status changed to ${status}.`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change status');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleRefresh = async () => {
    setError('');
    setRefreshing(true);
    try {
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh users');
    } finally {
      setRefreshing(false);
    }
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setCreatedTempPassword('');
    setCreating(true);
    try {
      const res = await adminApi.createUser(form);
      const tempPassword = res.data?.data?.tempPassword;
      setCreatedTempPassword(tempPassword || '');
      setSuccess('User created successfully.');
      setForm({ fullName: '', email: '', role: 'USER', password: '' });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user: User) => {
    setError('');
    setSuccess('');
    setEditingUserId(user._id);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({ fullName: '', email: '', role: 'USER', status: 'ACTIVE', password: '' });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUserId) return;
    setError('');
    setSuccess('');
    setSavingEdit(true);
    try {
      await adminApi.updateUser(editingUserId, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        status: editForm.status,
        password: editForm.password.trim() || undefined,
      });
      setSuccess('User updated successfully.');
      cancelEdit();
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !searchTerm ||
        (user.fullName || '').toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm);
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">User yaratish, tahrirlash va tezkor boshqaruv.</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary px-3 py-2 text-sm">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
        {createdTempPassword && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            User created. Temporary password: <span className="font-bold">{createdTempPassword}</span>
          </div>
        )}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Create User</h2>
          <form onSubmit={createUser} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="modern-input"
              placeholder="Full name"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="modern-input"
              placeholder="Email"
              required
            />
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as 'ADMIN' | 'USER' }))} className="modern-input">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="modern-input"
              placeholder="Password (optional)"
              minLength={6}
            />
            <button disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Add User'}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Password kiritilmasa, tizim vaqtinchalik parol yaratadi.
          </p>
        </div>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading users...</div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:grid-cols-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="modern-input md:col-span-2"
                  placeholder="Search by full name or email"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'USER')}
                  className="modern-input"
                >
                  <option value="ALL">All roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'BLOCKED')}
                  className="modern-input"
                >
                  <option value="ALL">All status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-5 py-4 font-semibold">{user.fullName || '-'}</td>
                      <td className="px-5 py-4 text-slate-500">{user.email}</td>
                      <td className="px-5 py-4">{user.role}</td>
                      <td className="px-5 py-4">{user.status}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(user)} className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold">
                            Edit
                          </button>
                          <button
                            disabled={!!actionLoadingKey}
                            onClick={() => changeRole(user._id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                            className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionLoadingKey === `role-${user._id}` ? 'Updating...' : 'Toggle Role'}
                          </button>
                          <button
                            disabled={!!actionLoadingKey}
                            onClick={() => changeStatus(user._id, user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}
                            className="rounded border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionLoadingKey === `status-${user._id}` ? 'Updating...' : user.status === 'ACTIVE' ? 'Block' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                        Filter bo&apos;yicha user topilmadi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
        {editingUserId && (
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Edit User</h2>
            <form onSubmit={saveEdit} className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="modern-input"
                placeholder="Full name"
                required
              />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                className="modern-input"
                placeholder="Email"
                required
              />
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value as 'ADMIN' | 'USER' }))}
                className="modern-input"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as 'ACTIVE' | 'BLOCKED' }))}
                className="modern-input"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                className="modern-input"
                placeholder="New password (optional)"
                minLength={6}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={savingEdit} className="btn-primary flex-1">
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-secondary px-3">
                  Cancel
                </button>
              </div>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              New password kiritilsa user paroli yangilanadi. Bo&apos;sh qolsa o&apos;zgarmaydi.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
