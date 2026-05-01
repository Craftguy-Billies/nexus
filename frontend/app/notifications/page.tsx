'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Zap, Info } from 'lucide-react';
import { notifications as notifApi } from '@/lib/api';
import type { Notification } from '@/types';
import { BottomNav } from '@/components/bottom-nav';

const ICON_MAP: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  energy: Zap,
  dm: MessageCircle,
  system: Info,
};

function groupByDate(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const map: Record<string, Notification[]> = {};
  for (const item of items) {
    const d = new Date(item.createdAt).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : 'Earlier';
    if (!map[label]) map[label] = [];
    map[label].push(item);
  }
  for (const label of ['Today', 'Yesterday', 'Earlier']) {
    if (map[label]) groups.push({ label, items: map[label] });
  }
  return groups;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifApi.list().then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const groups = groupByDate(items);

  return (
    <div className="flex flex-col pb-24">
      <header className="border-b border-neutral-200 px-4 py-3">
        <h1 className="text-[22px] font-semibold text-black">Notifications</h1>
      </header>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[14px] text-neutral-500">No notifications yet</p>
        </div>
      )}

      {groups.map(({ label, items: groupItems }) => (
        <div key={label}>
          <div className="px-4 py-2">
            <span className="text-[13px] font-semibold text-neutral-400">{label}</span>
          </div>
          {groupItems.map((n) => {
            const Icon = ICON_MAP[n.type] || Info;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 ${!n.isRead ? 'bg-neutral-50' : ''}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <Icon className="h-4 w-4 text-black" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug text-black">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <BottomNav />
    </div>
  );
}
