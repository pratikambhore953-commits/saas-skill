"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { NotificationItem, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(({ notifications }) => setItems(notifications))
      .finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await markAllNotificationsAsRead();
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const markOne = async (id: string) => {
    await markNotificationAsRead(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Notifications</h1>
        <button type="button" onClick={markAll} className="inline-flex min-h-11 items-center rounded-lg border border-amber-500/60 px-3 py-2 text-sm font-semibold text-amber-300">
          Mark all as read
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-slate-300">Loading notifications...</p>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<span>🔔</span>} title="No notifications" message="You&apos;re all caught up." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`rounded-xl border p-4 ${item.read ? "border-slate-700 bg-slate-900/70" : "border-amber-500/30 bg-amber-500/5"}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={`text-sm ${item.read ? "text-slate-200" : "font-semibold text-white"}`}>{item.title}</h2>
                {!item.read ? (
                  <button type="button" onClick={() => markOne(item.id)} className="text-xs text-amber-300 hover:text-amber-200">
                    Mark read
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-300">{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
