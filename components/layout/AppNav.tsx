"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLobbyStore } from "@/store/lobbyStore";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  const first = parts[0]?.charAt(0) ?? "";
  if (parts.length === 1) return first.toUpperCase();
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return (first + last).toUpperCase();
}

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const lobbyId = useLobbyStore((s) => s.lobbyId);

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-neon-green/10 text-neon-green"
        : "text-muted-foreground hover:bg-navy-surface hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-navy-border bg-navy-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-green/30 bg-neon-green/10 transition-colors group-hover:border-neon-green/60">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-neon-green"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </span>
          <span className="text-lg font-black tracking-tight text-white">
            Squad<span className="text-neon-green">Sync</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          {lobbyId && (
            <Link href={`/lobby/${lobbyId}`} className={linkClass(`/lobby/${lobbyId}`)}>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                Lobby
              </span>
            </Link>
          )}
          <Link href="/profile" className={linkClass("/profile")}>
            Profile
          </Link>
        </nav>

        {/* User controls */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <>
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-neon-green/30 bg-neon-green/10 text-xs font-bold text-neon-green">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(session.user.name ?? "?")
                )}
              </div>

              {/* Mobile nav links */}
              <div className="flex items-center gap-1 sm:hidden">
                <Link href="/dashboard" className={linkClass("/dashboard")}>
                  Home
                </Link>
                {lobbyId && (
                  <Link href={`/lobby/${lobbyId}`} className={linkClass(`/lobby/${lobbyId}`)}>
                    Lobby
                  </Link>
                )}
                <Link href="/profile" className={linkClass("/profile")}>
                  Profile
                </Link>
              </div>
            </>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-navy-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-neon-green/30 hover:text-neon-green"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
