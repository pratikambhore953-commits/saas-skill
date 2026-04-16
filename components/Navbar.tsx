"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { getSessions } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const [pendingSessionsCount, setPendingSessionsCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    getSessions("PENDING")
      .then((sessions) => setPendingSessionsCount(sessions.length))
      .catch(() => setPendingSessionsCount(0));
  }, [isAuthenticated, pathname]);

  const navLinkClass = (href: string) =>
    `transition-colors ${pathname === href ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700 bg-[#0F172A]/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          SkillSwap
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href="/browse" className={navLinkClass("/browse")}>
            Browse
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/chat" className="relative">
                <span className={navLinkClass("/chat")}>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link href="/analysis" className={`inline-flex items-center gap-1 ${navLinkClass("/analysis")}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m12 2 2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2Z" />
                </svg>
                Analysis
              </Link>
              <Link href="/matches" className={navLinkClass("/matches")}>
                Matches
              </Link>
              <Link href="/sessions" className="relative">
                <span className={navLinkClass("/sessions")}>Sessions</span>
                {pendingSessionsCount > 0 && (
                  <span className="absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-semibold text-black">
                    {pendingSessionsCount > 99 ? "99+" : pendingSessionsCount}
                  </span>
                )}
              </Link>
            </>
          ) : null}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? <NotificationBell /> : null}
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-300">Hi, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-500 bg-transparent px-3 py-1.5 text-sm font-medium text-amber-400 transition hover:border-amber-400 hover:text-amber-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-medium text-amber-400 hover:text-amber-300">
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-400"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-100 md:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-black/50 transition ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[92vw] border-l border-slate-700 bg-slate-900 p-5 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-white">Menu</p>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <MobileNavLink href="/browse" label="Browse" />
          {isAuthenticated ? (
            <>
              <MobileNavLink href="/dashboard" label="Dashboard" />
              <MobileNavLink href="/analysis" label="Analysis" />
              <MobileNavLink href="/matches" label="Matches" />
              <MobileNavLink href="/sessions" label="Sessions" />
              <MobileNavLink href="/chat" label="Chat" />
            </>
          ) : null}
        </div>

        <div className="mt-6 border-t border-slate-700 pt-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Hi, {user?.name}</span>
                <NotificationBell />
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <MobileNavLink href="/login" label="Login" />
              <Link
                href="/register"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>
    </header>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-amber-500/60 hover:text-amber-300"
    >
      {label}
    </Link>
  );
}
