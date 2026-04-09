"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { getSessions } from "@/lib/api";

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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    getSessions("PENDING")
      .then((sessions) => setPendingSessionsCount(sessions.length))
      .catch(() => setPendingSessionsCount(0));
  }, [isAuthenticated, pathname]);

  const navLinkClass = (href: string) =>
    `transition-colors ${pathname === href ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`;

  const displayedPendingSessionsCount = isAuthenticated ? pendingSessionsCount : 0;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-20 border-b border-slate-700 bg-[#0F172A]/95 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            SkillSwap
          </Link>

          <div className="flex items-center gap-5 text-sm font-medium">
            <Link href="/browse" className="text-slate-300 hover:text-amber-300 transition-colors">
              Browse
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Register
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-700 bg-[#0F172A]/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          SkillSwap
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium">
          <Link href="/browse" className={navLinkClass("/browse")}>
            Browse
          </Link>
          {isAuthenticated && (
            <Link href="/chat" className="relative">
              <span className={navLinkClass("/chat")}>Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link href="/matches" className={navLinkClass("/matches")}>
                Matches
              </Link>
              <Link href="/sessions" className="relative">
                <span className={navLinkClass("/sessions")}>Sessions</span>
                {displayedPendingSessionsCount > 0 && (
                  <span className="absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-semibold text-black">
                    {displayedPendingSessionsCount > 99 ? "99+" : displayedPendingSessionsCount}
                  </span>
                )}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline">Hi, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-amber-500 bg-transparent px-3 py-1.5 text-sm font-medium text-amber-400 transition hover:border-amber-400 hover:text-amber-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-amber-400 hover:text-amber-300">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-400"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
