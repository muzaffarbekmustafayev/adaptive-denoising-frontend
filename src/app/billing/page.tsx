'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiKeyApi, usageApi, type ApiKey } from '@/lib/api';

export default function BillingPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      const [keysRes, usageRes] = await Promise.all([apiKeyApi.list(), usageApi.getSummary()]);
      setKeys(keysRes.data.data || []);
      setSummary(usageRes.data.data || null);
    };
    run();
  }, []);

  const fakePlan = useMemo(() => {
    const used = keys.reduce((acc, key) => acc + key.usageCount, 0);
    const included = 1000;
    const extra = Math.max(0, used - included);
    return {
      name: 'Pro Sandbox',
      monthlyPrice: 29,
      included,
      used,
      extraCost: extra * 0.01,
      total: 29 + extra * 0.01,
    };
  }, [keys]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing (Fake)</h1>
          <p className="text-sm text-slate-500">No real card or payment gateway connected. Sandbox preview only.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Tile label="Plan" value={fakePlan.name} />
          <Tile label="Used Requests" value={String(fakePlan.used)} />
          <Tile label="Included" value={String(fakePlan.included)} />
          <Tile label="Estimated Total" value={`$${fakePlan.total.toFixed(2)}`} />
        </div>

        <div className="card p-5 text-sm text-slate-600 dark:text-slate-300">
          <p>Base price: ${fakePlan.monthlyPrice.toFixed(2)}</p>
          <p>Extra usage: ${fakePlan.extraCost.toFixed(2)}</p>
          <p className="mt-2 font-semibold">Usage success: {summary?.successCount || 0} / {summary?.totalRequests || 0}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
