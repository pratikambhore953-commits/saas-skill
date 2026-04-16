"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { getSessions } from "@/lib/api";

type NavLinkItem = {
  href: string;
  label: string;
  badge?: number;
};

function getInitials(name?: string): string {
  if (!name) return "SS";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useSocket();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingSessionsCount, setPendingSessionsCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    getSessions("PENDING")
      .then((sessions) => setPendingSessionsCount(sessions.length))
      .catch(() => setPendingSessionsCount(0));
  }, [isAuthenticated, pathname]);

  const desktopLinks = useMemo<NavLinkItem[]>(() => {
    if (!isAuthenticated) {
      return [{ href: "/browse", label: "Browse" }];
    }

    return [
      { href: "/browse", label: "Browse" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/analysis", label: "Analysis" },
      { href: "/matches", label: "Matches" },
      { href: "/chat", label: "Messages", badge: unreadCount },
      { href: "/sessions", label: "Sessions", badge: pendingSessionsCount },
    ];
  }, [isAuthenticated, pendingSessionsCount, unreadCount]);

  const mobileLinks = useMemo<NavLinkItem[]>(() => {
    const base: NavLinkItem[] = [{ href: "/browse", label: "Browse" }];

    if (!isAuthenticated) {
      return base;
    }

    return [
      ...base,
      { href: "/dashboard", label: "Dashboard" },
      { href: "/analysis", label: "Analysis" },
      { href: "/matches", label: "Matches" },
      { href: "/chat", label: "Messages", badge: unreadCount },
      { href: "/sessions", label: "Sessions", badge: pendingSessionsCount },
      { href: "/notifications", label: "Notifications" },
      { href: "/profile/edit", label: "Edit Profile" },
    ];
  }, [isAuthenticated, pendingSessionsCount, unreadCount]);

  const navLinkClass = (href: string) =>
    `relative rounded-lg px-2 py-1.5 text-sm font-medium transition ${
      pathname === href ? "text-amber-300" : "text-slate-300 hover:text-amber-200"
    }`;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-700 bg-[#0F172A]/95 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold text-white">SkillSwap</span>
          <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-700" />
        </nav>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-700 bg-[#0F172A]/95 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            SkillSwap
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {desktopLinks.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-black">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile/edit"
                  className="hidden min-h-11 items-center gap-2 rounded-full border border-slate-600 bg-slate-900/70 px-2 py-1 pr-3 transition hover:border-amber-400/60 md:inline-flex"
                >
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Profile"
                      width={28}
                      height={28}
                      unoptimized
                      loading="lazy"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-300">
                      {getInitials(user?.name)}
                    </span>
                  )}
                  <span className="max-w-28 truncate text-sm text-slate-200">{user?.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden min-h-11 rounded-lg border border-amber-500/70 px-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:text-amber-200 md:inline-flex md:items-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-amber-300 hover:text-amber-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center rounded-lg bg-amber-500 px-3.5 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  Register
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-900/60 text-slate-100 transition hover:border-amber-400/50 md:hidden"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close mobile menu backdrop"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-[86vw] max-w-sm border-l border-slate-700 bg-slate-900 p-4 md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">Menu</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-100"
                  aria-label="Close menu"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {isAuthenticated && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3">
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Profile"
                      width={40}
                      height={40}
                      unoptimized
                      loading="lazy"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-300">
                      {getInitials(user?.name)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {mobileLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center justify-between rounded-lg border border-slate-700 bg-slate-800/70 px-3 text-sm font-medium text-slate-100"
                  >
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-black">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid gap-2">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-500/70 text-sm font-semibold text-amber-300"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 text-sm font-semibold text-slate-100"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 text-sm font-semibold text-black"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
