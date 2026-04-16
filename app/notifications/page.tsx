"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  NotificationItem,
  deleteNotificationById,
  getNotificationsList,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api";

function timeAgo(input: string): string {
  const then = new Date(input).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationsList();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark all as read");
    }
  };

  const handleMarkOne = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark notification as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const target = notifications.find((item) => item.id === notificationId);
      await deleteNotificationById(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete notification");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-4xl px-4 py-10"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-300">Unread: {unreadCount}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleMarkAll()}
          disabled={unreadCount === 0}
          className="rounded-lg border border-amber-500/60 px-3 py-2 text-sm font-semibold text-amber-300 hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark all as read
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-800" />
          ))
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-12 text-center text-slate-300">
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.read
                  ? "border-slate-700 bg-slate-900/70"
                  : "border-amber-500/40 bg-amber-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm ${item.read ? "font-medium text-slate-200" : "font-semibold text-white"}`}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{timeAgo(item.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => void handleMarkOne(item.id)}
                      className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-amber-400"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="rounded-md border border-red-800 px-2 py-1 text-xs text-red-300 hover:border-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </motion.div>
  );
}
