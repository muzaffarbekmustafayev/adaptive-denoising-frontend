'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiActivity,
  FiBarChart2,
  FiBell,
  FiBook,
  FiBriefcase,
  FiCpu,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiKey,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSettings,
  FiShield,
  FiSun,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useUser } from '@/lib/UserContext';
import { useTheme } from './ThemeProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userRole = user?.role ?? null;
  const userFullName = user?.fullName ?? 'User';

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Audio Denoising', href: '/denoise', icon: FiActivity },
    { name: 'Jobs Manager', href: '/jobs', icon: FiBriefcase },
    { name: 'Devices', href: '/devices', icon: FiCpu },
    { name: 'Monitoring', href: '/monitoring', icon: FiActivity },
    { name: 'Statistics', href: '/statistics', icon: FiBarChart2 },
    { name: 'Reports', href: '/reports', icon: FiFileText },
    { name: 'Notifications', href: '/notifications', icon: FiBell },
    { name: 'Audit Logs', href: '/audit-logs', icon: FiShield },
    { name: 'Billing (Fake)', href: '/billing', icon: FiCreditCard },
    { name: 'API Keys', href: '/api-keys', icon: FiKey },
    { name: 'Engine Settings', href: '/engine-settings', icon: FiSettings },
  ];

  const adminNavigation = [
    { name: 'Admin Overview', href: '/admin', icon: FiUsers },
    { name: 'User Management', href: '/admin/users', icon: FiUsers },
    { name: 'Job Operations', href: '/admin/jobs', icon: FiBriefcase },
    { name: 'System Health', href: '/admin/system-health', icon: FiActivity },
    { name: 'Audit & Security', href: '/admin/audit-security', icon: FiShield },
    { name: 'System Statistics', href: '/admin/statistics', icon: FiBarChart2 },
  ];

  const bottomNavigation = [
    { name: 'Documentation', href: '/api-docs', icon: FiBook },
    { name: 'Profile', href: '/profile', icon: FiUser },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const navigation = userRole === 'ADMIN' ? adminNavigation : userNavigation;
  const allNavigation = [...navigation, ...bottomNavigation];

  const isRouteActive = (itemHref: string) => {
    if (itemHref === '/admin' || itemHref === '/dashboard') {
      return pathname === itemHref;
    }
    return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
  };

  const currentPage = allNavigation.find((item) => isRouteActive(item.href));

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar-container fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-6">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <FiActivity className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Denoise.AI</span>
          </Link>
          <button
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
          <NavGroup title="Platform" items={navigation} pathname={pathname} onNavigate={() => setIsSidebarOpen(false)} />
          <NavGroup title="Resources" items={bottomNavigation} pathname={pathname} onNavigate={() => setIsSidebarOpen(false)} />
        </div>

        <div className="border-t border-border/50 p-4 bg-muted/30">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-sm font-bold text-foreground shadow-sm">
                {userFullName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500"></div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{userFullName}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{userRole || 'USER'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl border border-border/50 px-4 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:border-danger/30 hover:bg-danger/5 hover:text-danger"
          >
            <FiLogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-6 sticky top-0 z-30">
          <div className="flex min-w-0 items-center gap-4">
            <button
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground tracking-tight">{currentPage?.name || 'Overview'}</h1>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">System Operational</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted hover:border-border/80 shadow-sm"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl page-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: Array<{ name: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
  pathname: string;
  onNavigate: () => void;
}) {
  const isRouteActive = (itemHref: string) => {
    if (itemHref === '/admin' || itemHref === '/dashboard') {
      return pathname === itemHref;
    }
    return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
  };

  return (
    <div className="mb-6">
      <p className="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{title}</p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = isRouteActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={onNavigate}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/70'}`} />
              <span className="truncate tracking-tight">{item.name}</span>
              {isActive && <div className="ml-auto h-1 w-1 rounded-full bg-primary"></div>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
