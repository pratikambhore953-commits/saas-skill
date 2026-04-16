"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import {
  type NotificationItem,
  type NotificationType,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api";

type BellProps = {
  className?: string;
};

const ICONS: Record<NotificationType, { color: string; icon: string }> = {
  SESSION_BOOKED: { color: "text-blue-300", icon: "📅" },
  SESSION_ACCEPTED: { color: "text-emerald-300", icon: "✅" },
  SESSION_REJECTED: { color: "text-red-300", icon: "⛔" },
  SESSION_REMINDER: { color: "text-cyan-300", icon: "⏰" },
  TASK_SCORED: { color: "text-violet-300", icon: "🏆" },
  TASK_ACCEPTED: { color: "text-indigo-300", icon: "🎯" },
  NEW_MESSAGE: { color: "text-amber-300", icon: "💬" },
  NEW_MATCH: { color: "text-teal-300", icon: "🤝" },
  SYSTEM: { color: "text-slate-300", icon: "🔔" },
};

function timeAgo(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function NotificationBell({ className = "" }: BellProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotifications()
      .then(({ notifications, unreadCount: count }) => {
        setItems(notifications);
        setUnreadCount(count);
      })
      .catch(() => {
        setItems([]);
        setUnreadCount(0);
      });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNewNotification = (notification: NotificationItem) => {
      setItems((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 1000);
    };

    socket.on("new_notification", onNewNotification);
    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, [socket]);

  const latestItems = useMemo(() => items.slice(0, 10), [items]);

  const onMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const onOpenNotification = async (notification: NotificationItem) => {
    if (!notification.read) {
      setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationAsRead(notification.id);
      } catch {}
    }
    setOpen(false);
    router.push(notification.link || "/notifications");
  };

  const onDelete = async (notificationId: string) => {
    const target = items.find((item) => item.id === notificationId);
    setItems((prev) => prev.filter((item) => item.id !== notificationId));
    if (target && !target.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await deleteNotification(notificationId);
    } catch {}
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 text-slate-200 transition hover:border-amber-500/60 hover:text-amber-300 ${
          pulse ? "animate-pulse" : ""
        }`}
        aria-label="Open notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-40 mt-2 w-[min(24rem,90vw)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200"
              >
                Mark all as read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {latestItems.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p>
              ) : (
                latestItems.map((item) => {
                  const icon = ICONS[item.type] ?? ICONS.SYSTEM;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenNotification(item)}
                      className={`group w-full border-b border-slate-800 px-4 py-3 text-left transition last:border-b-0 ${
                        item.read ? "bg-slate-900" : "bg-amber-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`pt-0.5 text-lg ${icon.color}`}>{icon.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${item.read ? "font-medium text-slate-100" : "font-semibold text-white"}`}>
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-slate-300">{item.message}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{timeAgo(item.created_at)}</p>
                        </div>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            void onDelete(item.id);
                          }}
                          className="cursor-pointer text-xs text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-red-300"
                        >
                          ×
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-700 px-4 py-3 text-center">
              <Link href="/notifications" className="text-sm font-semibold text-amber-300 hover:text-amber-200" onClick={() => setOpen(false)}>
                View all
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
