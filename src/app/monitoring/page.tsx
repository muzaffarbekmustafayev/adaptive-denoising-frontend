'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { audioApi, type AudioJob } from '@/lib/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { FiActivity, FiClock, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

const COLORS = {
  queued: '#6366f1',    // Indigo
  processing: '#fbbf24', // Amber
  completed: '#10b981', // Emerald
  failed: '#f43f5e'     // Rose
};

export default function MonitoringPage() {
  const [jobs, setJobs] = useState<AudioJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await audioApi.getMyJobs();
        setJobs(res.data.data || []);
      } catch (error) {
        console.error("Ma'lumot yuklashda xatolik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const queued = jobs.filter((j) => j.status === 'QUEUED').length;
    const processing = jobs.filter((j) => j.status === 'PROCESSING').length;
    const completed = jobs.filter((j) => j.status === 'COMPLETED').length;
    const failed = jobs.filter((j) => j.status === 'FAILED').length;
    const total = jobs.length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { queued, processing, completed, failed, total, successRate };
  }, [jobs]);

  const pieData = [
    { name: 'Kutilmoqda', value: metrics.queued, color: COLORS.queued },
    { name: 'Jarayonda', value: metrics.processing, color: COLORS.processing },
    { name: 'Tugallangan', value: metrics.completed, color: COLORS.completed },
    { name: 'Xato', value: metrics.failed, color: COLORS.failed },
  ].filter(d => d.value > 0);

  // So'nggi 7 kundagi trend (Simulyatsiya uchun)
  const trendData = [
    { day: 'Dush', count: 4 },
    { day: 'Sesh', count: 7 },
    { day: 'Chor', count: 5 },
    { day: 'Pay', count: 12 },
    { day: 'Jum', count: 9 },
    { day: 'Shan', count: 15 },
    { day: 'Yak', count: metrics.completed },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-4">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Tizim Monitoringi</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Barcha audio jarayonlar va tizim holati real vaqtda.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-sm font-bold border border-emerald-100 dark:border-emerald-800">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Tizim Online
          </div>
        </header>

        {/* Asosiy Kartalar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Jami Vazifalar" value={metrics.total} icon={<FiActivity />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-900/20" />
          <StatCard label="Jarayonda" value={metrics.processing} icon={<FiClock />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
          <StatCard label="Muvaffaqiyatli" value={metrics.completed} icon={<FiCheckCircle />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatCard label="Samaradorlik" value={`${metrics.successRate}%`} icon={<FiTrendingUp />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Grafigi */}
          <div className="lg:col-span-2 card p-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-indigo-500" /> Haftalik Faollik
            </h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Taqsimot (Donut Chart) */}
          <div className="card p-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <h2 className="text-lg font-bold mb-6">Statuslar Taqsimoti</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip cursor={{fill: 'transparent'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value} ta</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Qo'shimcha ma'lumot */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10">
                <h3 className="text-xl font-bold">Worker Status: Active</h3>
                <p className="text-indigo-100 opacity-80">Hozirda 4 ta parallel worker audio fayllarga ishlov bermoqda.</p>
            </div>
            <FiActivity className="text-8xl absolute -right-4 opacity-10 rotate-12" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string, bg: string }) {
  return (
    <div className="card p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm transition-transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color} text-xl`}>
          {icon}
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
        {value}
      </div>
    </div>
  );
}