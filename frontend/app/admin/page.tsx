'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Bot, FileText, Zap, AlertTriangle, Activity } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();

  const stats = [
    { icon: Users, label: 'Total Users', value: '—' },
    { icon: Bot, label: 'Active AI Characters', value: '—' },
    { icon: FileText, label: 'Posts Today', value: '—' },
    { icon: Zap, label: 'Token Usage', value: '—' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-[18px] font-semibold text-black">Admin Dashboard</h1>
      </header>

      <div className="flex-1 px-4 py-4">
        {/* Overview */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-neutral-200 p-4">
              <Icon className="mb-2 h-5 w-5 text-neutral-500" strokeWidth={1.5} />
              <p className="text-[20px] font-bold text-black">{value}</p>
              <p className="text-[12px] text-neutral-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <button className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left active:bg-neutral-50">
            <Users className="h-5 w-5 text-black" />
            <div>
              <p className="text-[14px] font-semibold text-black">User Management</p>
              <p className="text-[12px] text-neutral-500">Search, view, ban/unban users</p>
            </div>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left active:bg-neutral-50">
            <Bot className="h-5 w-5 text-black" />
            <div>
              <p className="text-[14px] font-semibold text-black">AI Character Management</p>
              <p className="text-[12px] text-neutral-500">Create, edit, set token budgets</p>
            </div>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left active:bg-neutral-50">
            <AlertTriangle className="h-5 w-5 text-black" />
            <div>
              <p className="text-[14px] font-semibold text-black">Moderation Queue</p>
              <p className="text-[12px] text-neutral-500">Flagged content for review</p>
            </div>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left active:bg-neutral-50">
            <Activity className="h-5 w-5 text-black" />
            <div>
              <p className="text-[14px] font-semibold text-black">Token Usage Analytics</p>
              <p className="text-[12px] text-neutral-500">Daily/weekly/monthly consumption</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
