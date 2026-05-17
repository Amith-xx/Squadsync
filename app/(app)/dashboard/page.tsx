import Link from "next/link";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Lobby from "@/lib/db/models/Lobby";
import { KarmaBadge } from "@/components/profile/KarmaBadge";
import { DashboardLobbies } from "@/components/lobby/DashboardLobbies";
import type { LobbyListItem } from "@/types";

const POSITION_LABELS: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

export default async function DashboardPage() {
  const session = await auth();
  await connectToDatabase();

  const user = await User.findById(session?.user?.id)
    .select("name karmaScore matchesPlayed matchesCompleted position attributes region")
    .lean();

  const firstName = user?.name?.split(" ")[0] ?? "Player";
  const overall = user?.attributes
    ? Math.round(Object.values(user.attributes).reduce((s: number, v) => s + (v as number), 0) / 5)
    : 60;
  const positionLabel = user?.position ? (POSITION_LABELS[user.position] ?? user.position) : "—";
  const region = user?.region ?? null;

  // Check if user is already in an active lobby (any pre-completed state)
  let existingLobbyId: string | null = null;
  if (session?.user?.id) {
    const activeLobby = await Lobby.findOne({
      "players.userId": new Types.ObjectId(session.user.id),
      status: { $in: ["waiting", "ready_check", "voting", "confirmed", "active"] },
    })
      .select("_id")
      .lean();
    if (activeLobby) existingLobbyId = activeLobby._id.toString();
  }

  // Fetch available lobbies in the user's region
  let initialLobbies: LobbyListItem[] = [];
  if (region) {
    const lobbies = await Lobby.find({ region, status: "waiting" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    initialLobbies = lobbies.map((l) => ({
      id: l._id.toString(),
      status: l.status,
      region: l.region,
      playerCount: l.players.length,
      expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
      createdAt: (l.createdAt as Date).toISOString(),
    }));
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Welcome header */}
      <div className="mb-6 sm:mb-8 animate-fade-in-up">
        <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
        <h1 className="mt-0.5 text-2xl font-black text-white sm:text-3xl">
          {firstName} <span className="text-neon-green">↗</span>
        </h1>
        {user && (
          <div className="mt-2">
            <KarmaBadge karmaScore={user.karmaScore} showScore size="md" />
          </div>
        )}
      </div>

      {/* Quick stats row — 3 cols on all sizes but tighter on mobile */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-3">
        {[
          { label: "Overall",  value: String(overall),                    accent: true  },
          { label: "Karma",    value: String(user?.karmaScore ?? 70),     accent: false },
          { label: "Matches",  value: String(user?.matchesPlayed ?? 0),   accent: false },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className={`rounded-xl border p-3 text-center transition-colors sm:p-4 ${
              accent
                ? "border-neon-green/30 bg-neon-green/5"
                : "border-navy-border bg-navy-dark"
            }`}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
              {label}
            </p>
            <p
              className={`mt-1 text-2xl font-black tabular-nums sm:text-3xl ${
                accent ? "text-neon-green text-glow" : "text-white"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Position */}
      <div className="mb-6 rounded-xl border border-navy-border bg-navy-dark px-4 py-3 sm:mb-8 sm:px-5 sm:py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Your Position
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-black text-white sm:text-2xl">{user?.position ?? "—"}</span>
          <span className="text-sm text-muted-foreground">{positionLabel}</span>
        </div>
      </div>

      {/* Matchmaking section */}
      {region ? (
        <div className="mb-6 sm:mb-8">
          <DashboardLobbies
            region={region}
            initialLobbies={initialLobbies}
            userId={session?.user?.id ?? ""}
            existingLobbyId={existingLobbyId}
          />
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 sm:mb-8 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
            Region Required
          </p>
          <h2 className="mt-1 text-lg font-black text-white">Set Your Region</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your profile to select a region before joining matchmaking.
          </p>
          <Link
            href="/onboarding?edit=true"
            className="mt-4 inline-block rounded-xl border border-yellow-400/20 bg-yellow-400/15 px-4 py-2 text-sm font-bold text-yellow-400 transition-colors hover:bg-yellow-400/25"
          >
            Set Region
          </Link>
        </div>
      )}

      {/* View Profile link */}
      <Link
        href="/profile"
        className="group flex flex-col rounded-2xl border border-neon-green/20 bg-neon-green/5 p-5 transition-all hover:border-neon-green/40 hover:bg-neon-green/10 hover:shadow-[0_0_24px_rgba(0,230,115,0.15)] sm:p-6"
      >
        <span className="inline-block rounded-full border border-neon-green/20 bg-neon-green/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neon-green">
          Ready
        </span>
        <h2 className="mt-3 text-xl font-black text-white">Your Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View your player card, attributes, and karma tier.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-neon-green">
          View Profile
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </main>
  );
}
