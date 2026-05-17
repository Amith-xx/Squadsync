import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Match from "@/lib/db/models/Match";
import Memory from "@/lib/db/models/Memory";
import { AttributeCircle } from "@/components/profile/AttributeCircle";
import { StatCard, InfoCard } from "@/components/profile/StatCard";
import { KarmaBadge } from "@/components/profile/KarmaBadge";
import { MemoryVault } from "@/components/profile/MemoryVault";
import type {
  OutfieldAttributes,
  GKAttributes,
  MatchStatus,
  Team,
  MemoryClient,
} from "@/types";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  const first = parts[0]?.charAt(0) ?? "";
  if (parts.length === 1) return first.toUpperCase();
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return (first + last).toUpperCase();
}

const POSITION_LABELS: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

const OUTFIELD_attrDefs: { key: keyof OutfieldAttributes; label: string; abbr: string }[] = [
  { key: "pace",      label: "Pace",      abbr: "PAC" },
  { key: "shooting",  label: "Shooting",  abbr: "SHO" },
  { key: "passing",   label: "Passing",   abbr: "PAS" },
  { key: "defending", label: "Defending", abbr: "DEF" },
  { key: "physical",  label: "Physical",  abbr: "PHY" },
];

const GK_attrDefs: { key: keyof GKAttributes; label: string; abbr: string }[] = [
  { key: "diving",   label: "Diving",    abbr: "DIV" },
  { key: "reflex",   label: "Reflexes",  abbr: "REF" },
  { key: "speed",    label: "Speed",     abbr: "SPD" },
  { key: "handling", label: "Handling",  abbr: "HAN" },
  { key: "physical", label: "Physical",  abbr: "PHY" },
];

export default async function ProfilePage() {
  const session = await auth();
  await connectToDatabase();

  const user = await User.findById(session?.user?.id).lean();
  if (!user) notFound();

  const isGK = user.position === "GK";
  const rawAttrs = (user.attributes ?? {}) as Partial<OutfieldAttributes> & Partial<GKAttributes>;

  const attrs = isGK
    ? ({
        diving:   rawAttrs.diving   ?? 60,
        reflex:   rawAttrs.reflex   ?? 60,
        speed:    rawAttrs.speed    ?? 60,
        handling: rawAttrs.handling ?? 60,
        physical: rawAttrs.physical ?? 60,
      } satisfies GKAttributes)
    : ({
        pace:      rawAttrs.pace      ?? 60,
        shooting:  rawAttrs.shooting  ?? 60,
        passing:   rawAttrs.passing   ?? 60,
        defending: rawAttrs.defending ?? 60,
        physical:  rawAttrs.physical  ?? 60,
      } satisfies OutfieldAttributes);

  const attrDefs = isGK ? GK_attrDefs : OUTFIELD_attrDefs;

  const overall = Math.round(
    Object.values(attrs).reduce((sum, v) => sum + v, 0) / 5,
  );
  const initials = getInitials(user.name);
  const positionLabel = user.position
    ? (POSITION_LABELS[user.position] ?? user.position)
    : "—";

  // Recent match history (last 5)
  const recentMatches = await Match.find({
    $or: [
      { teamA: new Types.ObjectId(user._id.toString()) },
      { teamB: new Types.ObjectId(user._id.toString()) },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  interface MatchHistoryRow {
    id: string;
    status: MatchStatus;
    finalScore: { teamA: number; teamB: number } | null;
    team: Team | null;
    createdAt: string;
  }

  const matchHistory: MatchHistoryRow[] = recentMatches.map((m) => {
    const uid = user._id.toString();
    const team: Team | null = m.teamA.some((x: Types.ObjectId) => x.toString() === uid)
      ? "A"
      : m.teamB.some((x: Types.ObjectId) => x.toString() === uid)
      ? "B"
      : null;
    return {
      id: m._id.toString(),
      status: m.status as MatchStatus,
      finalScore: m.finalScore ?? null,
      team,
      createdAt: (m.createdAt as Date).toISOString(),
    };
  });

  // Football Memory Vault
  const rawMemories = await Memory.find({
    userId: new Types.ObjectId(user._id.toString()),
  })
    .sort({ createdAt: -1 })
    .lean();

  const initialMemories: MemoryClient[] = rawMemories.map((m) => ({
    id: (m._id as Types.ObjectId).toString(),
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    playerOfMatch: m.playerOfMatch,
    competition: m.competition,
    matchDate: m.matchDate ? m.matchDate.toISOString() : null,
    favoriteMoment: m.favoriteMoment,
    note: m.note,
    createdAt: (m.createdAt as Date).toISOString(),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Player Profile
      </p>

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <section className="mb-4 rounded-2xl border border-navy-border bg-navy-dark p-4 sm:p-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-3">
          {/* Left: avatar + info */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="h-14 w-14 rounded-full border-2 border-neon-green/40 object-cover sm:h-16 sm:w-16"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-neon-green/40 bg-neon-green/10 text-xl font-black text-neon-green sm:h-16 sm:w-16">
                  {initials}
                </div>
              )}
              {user.position && (
                <span className="absolute -bottom-1 -right-1 rounded bg-neon-green px-1.5 py-0.5 text-[9px] font-black text-navy-darkest">
                  {user.position}
                </span>
              )}
            </div>

            {/* Name & meta */}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-white sm:text-2xl">{user.name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="text-white">{positionLabel}</span>
                {" · "}
                <span className="text-white">Free Agent</span>
              </p>
              <div className="mt-2">
                <KarmaBadge karmaScore={user.karmaScore} showScore />
              </div>
            </div>
          </div>

          {/* Right: overall rating + edit */}
          <div className="flex shrink-0 flex-col items-end gap-2 sm:gap-3">
            {/* OVR badge */}
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-neon-green shadow-[0_0_20px_rgba(0,230,115,0.4)] sm:h-16 sm:w-16">
              <span className="text-xl font-black leading-none text-navy-darkest sm:text-2xl">
                {overall}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-navy-darkest/60">
                OVR
              </span>
            </div>

            {/* Edit profile */}
            <Link
              href="/onboarding?edit=true"
              className="flex items-center gap-1.5 rounded-lg border border-neon-green/30 bg-neon-green/10 px-2.5 py-1.5 text-xs font-semibold text-neon-green transition-colors hover:border-neon-green/60 hover:bg-neon-green/20"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Attribute circles (FIFA style) ──────────────────────────────── */}
      <section className="mb-4 rounded-2xl border border-navy-border bg-navy-dark p-4 sm:p-6 animate-fade-in-up [animation-delay:80ms]">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Player Attributes
        </p>
        <div className="flex items-center justify-around gap-1 overflow-x-auto pb-1">
          {attrDefs.map(({ key, label, abbr }) => (
            <AttributeCircle
              key={key}
              abbr={abbr}
              label={label}
              value={((attrs as unknown as Record<string, number>)[key]) ?? 60}
            />
          ))}
        </div>
      </section>

      {/* ── Stat cards grid ─────────────────────────────────────────────── */}
      <section className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 animate-fade-in-up [animation-delay:150ms]">
        {attrDefs.map(({ key, label, abbr }) => (
          <StatCard key={key} abbr={abbr} label={label} value={((attrs as unknown as Record<string, number>)[key]) ?? 60} />
        ))}
      </section>

      {/* ── Info row ────────────────────────────────────────────────────── */}
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 animate-fade-in-up [animation-delay:220ms]">
        <InfoCard label="Karma Score"    value={user.karmaScore} />
        <InfoCard label="Matches Played" value={user.matchesPlayed} />
        <InfoCard label="Position"       value={positionLabel} />
      </section>

      {/* ── Match History ────────────────────────────────────────────────── */}
      <section className="mb-6 animate-fade-in-up [animation-delay:290ms]">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Recent Matches
        </p>
        {matchHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-navy-border py-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No matches yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Play your first match to see history here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matchHistory.map((m) => {
              const isWin =
                m.finalScore && m.team
                  ? (m.team === "A" && m.finalScore.teamA > m.finalScore.teamB) ||
                    (m.team === "B" && m.finalScore.teamB > m.finalScore.teamA)
                  : null;
              const isDraw =
                m.finalScore
                  ? m.finalScore.teamA === m.finalScore.teamB
                  : null;

              return (
                <Link
                  key={m.id}
                  href={`/match/${m.id}`}
                  className="flex items-center justify-between rounded-xl border border-navy-border bg-navy-dark px-4 py-3 transition-all hover:border-neon-green/30 hover:bg-navy-surface"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                      m.status !== "confirmed"
                        ? "bg-navy-surface text-muted-foreground"
                        : isWin === true
                        ? "bg-neon-green/15 text-neon-green"
                        : isDraw
                        ? "bg-yellow-400/15 text-yellow-400"
                        : "bg-red-500/15 text-red-400"
                    }`}>
                      {m.status !== "confirmed" ? "—" : isWin ? "W" : isDraw ? "D" : "L"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">
                        {m.team ? `Team ${m.team}` : "Match"}
                        {m.status === "disputed" && (
                          <span className="ml-2 text-[9px] font-bold text-red-400">DISPUTED</span>
                        )}
                        {m.status === "pending_reports" && (
                          <span className="ml-2 text-[9px] font-bold text-yellow-400">PENDING</span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {m.finalScore && (
                    <span className="shrink-0 text-sm font-black tabular-nums text-white">
                      {m.finalScore.teamA} – {m.finalScore.teamB}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Football Memory Vault ────────────────────────────────────────── */}
      <MemoryVault initialMemories={initialMemories} />
    </main>
  );
}
