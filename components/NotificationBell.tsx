"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  NotificationItem,
  NotificationType,
  getNotificationsList,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api";

type NotificationIconMeta = {
  label: string;
  className: string;
  path: string;
};

const iconMap: Record<NotificationType, NotificationIconMeta> = {
  SESSION_BOOKED: {
    label: "Session booked",
    className: "bg-blue-500/20 text-blue-300",
    path: "M8 2v2M16 2v2M3 10h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z",
  },
  SESSION_ACCEPTED: {
    label: "Session accepted",
    className: "bg-emerald-500/20 text-emerald-300",
    path: "m5 12 4 4 10-10",
  },
  SESSION_REJECTED: {
    label: "Session rejected",
    className: "bg-rose-500/20 text-rose-300",
    path: "M6 6l12 12M18 6 6 18",
  },
  SESSION_REMINDER: {
    label: "Session reminder",
    className: "bg-cyan-500/20 text-cyan-300",
    path: "M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  },
  TASK_SCORED: {
    label: "Task scored",
    className: "bg-violet-500/20 text-violet-300",
    path: "M4 18h16M7 14 11 10l3 3 5-5",
  },
  TASK_ACCEPTED: {
    label: "Task accepted",
    className: "bg-fuchsia-500/20 text-fuchsia-300",
    path: "M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z",
  },
  NEW_MESSAGE: {
    label: "New message",
    className: "bg-indigo-500/20 text-indigo-300",
    path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z",
  },
  NEW_MATCH: {
    label: "New match",
    className: "bg-amber-500/20 text-amber-300",
    path: "m12 21-1.5-1.3C5 14.8 2 11.8 2 8.1 2 5 4.4 2.5 7.4 2.5c1.8 0 3.4.8 4.6 2.2 1.2-1.4 2.8-2.2 4.6-2.2 3 0 5.4 2.5 5.4 5.6 0 3.7-3 6.7-8.5 11.6L12 21Z",
  },
  SYSTEM: {
    label: "System",
    className: "bg-slate-500/20 text-slate-300",
    path: "M12 2v4M12 18v4M4.9 4.9 7.7 7.7M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
  },
};

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

function truncate(text: string, max = 90): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export default function NotificationBell() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const topTen = useMemo(() => notifications.slice(0, 10), [notifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let active = true;
    setLoading(true);

    getNotificationsList()
      .then((data) => {
        if (!active) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const onNewNotification = (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 1400);
    };

    socket.on("new_notification", onNewNotification);
    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, [socket, isAuthenticated]);

  useEffect(() => {
    if (!open) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (!isAuthenticated) {
    return null;
  }

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // No-op: navigation still proceeds.
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 text-slate-200 transition hover:border-amber-400/60 hover:text-amber-300"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          animate={pulse ? { scale: [1, 1.14, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <path d="M15 17h5l-1.4-1.4c-.4-.4-.6-1-.6-1.5V11a6 6 0 1 0-12 0v3.1c0 .6-.2 1.1-.6 1.5L4 17h5" />
          <path d="M10 19a2 2 0 1 0 4 0" />
        </motion.svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-3 w-[22rem] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markingAll || unreadCount === 0}
                className="text-xs font-semibold text-amber-300 transition hover:text-amber-200 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {markingAll ? "Marking..." : "Mark all as read"}
              </button>
            </div>

            <div className="max-h-[24rem] overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-14 animate-pulse rounded-xl bg-slate-800" />
                  ))}
                </div>
              ) : topTen.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p>
              ) : (
                topTen.map((notification) => {
                  const icon = iconMap[notification.type] ?? iconMap.SYSTEM;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={`w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-800/80 ${
                        notification.read ? "bg-transparent" : "bg-amber-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${icon.className}`}
                          aria-label={icon.label}
                        >
                          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d={icon.path} />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${notification.read ? "font-medium text-slate-200" : "font-semibold text-white"}`}>
                            {notification.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-300">{truncate(notification.message)}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{timeAgo(notification.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-700 px-4 py-2.5">
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-amber-300 hover:text-amber-200">
                View all
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
