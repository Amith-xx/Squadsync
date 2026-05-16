import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { AttributeCircle } from "@/components/profile/AttributeCircle";
import { StatCard, InfoCard } from "@/components/profile/StatCard";
import { KarmaBadge } from "@/components/profile/KarmaBadge";
import type { PlayerAttributes } from "@/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function computeOverall(attrs: PlayerAttributes): number {
  return Math.round(
    (attrs.pace + attrs.shooting + attrs.passing + attrs.defending + attrs.physical) / 5,
  );
}

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

const ATTR_DEFS: { key: keyof PlayerAttributes; label: string; abbr: string }[] = [
  { key: "pace", label: "Pace", abbr: "PAC" },
  { key: "shooting", label: "Shooting", abbr: "SHO" },
  { key: "passing", label: "Passing", abbr: "PAS" },
  { key: "defending", label: "Defending", abbr: "DEF" },
  { key: "physical", label: "Physical", abbr: "PHY" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const session = await auth();
  await connectToDatabase();

  const user = await User.findById(session?.user?.id).lean();
  if (!user) notFound();

  const attrs: PlayerAttributes = {
    pace: user.attributes?.pace ?? 60,
    shooting: user.attributes?.shooting ?? 60,
    passing: user.attributes?.passing ?? 60,
    defending: user.attributes?.defending ?? 60,
    physical: user.attributes?.physical ?? 60,
  };

  const overall = computeOverall(attrs);
  const initials = getInitials(user.name);
  const positionLabel = user.position
    ? (POSITION_LABELS[user.position] ?? user.position)
    : "—";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Player Profile
      </p>

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <section className="mb-4 rounded-2xl border border-navy-border bg-navy-dark p-5 sm:p-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full border-2 border-neon-green/40 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-green/40 bg-neon-green/10 text-xl font-black text-neon-green">
                  {initials}
                </div>
              )}
              {/* Position badge on avatar */}
              {user.position && (
                <span className="absolute -bottom-1 -right-1 rounded bg-neon-green px-1.5 py-0.5 text-[9px] font-black text-navy-darkest">
                  {user.position}
                </span>
              )}
            </div>

            {/* Name & meta */}
            <div>
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Position ·{" "}
                <span className="text-white">{positionLabel}</span>
                {"  "}· Club ·{" "}
                <span className="text-white">Free Agent</span>
              </p>
              <div className="mt-2">
                <KarmaBadge karmaScore={user.karmaScore} showScore />
              </div>
            </div>
          </div>

          {/* Right: overall rating + edit */}
          <div className="flex flex-col items-end gap-3">
            {/* OVR badge */}
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-neon-green shadow-[0_0_20px_rgba(0,230,115,0.4)]">
              <span className="text-2xl font-black leading-none text-navy-darkest">
                {overall}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-navy-darkest/60">
                OVR
              </span>
            </div>

            {/* Edit profile */}
            <Link
              href="/onboarding?edit=true"
              className="flex items-center gap-1.5 rounded-lg border border-neon-green/30 bg-neon-green/10 px-3 py-1.5 text-xs font-semibold text-neon-green transition-colors hover:border-neon-green/60 hover:bg-neon-green/20"
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
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      {/* ── Attribute circles (FIFA style) ──────────────────────────────── */}
      <section className="mb-4 rounded-2xl border border-navy-border bg-navy-dark p-5 sm:p-6 animate-fade-in-up [animation-delay:80ms]">
        <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Player Attributes
        </p>
        <div className="flex items-center justify-around gap-2">
          {ATTR_DEFS.map(({ key, label, abbr }) => (
            <AttributeCircle
              key={key}
              abbr={abbr}
              label={label}
              value={attrs[key]}
            />
          ))}
        </div>
      </section>

      {/* ── Stat cards grid ─────────────────────────────────────────────── */}
      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5 animate-fade-in-up [animation-delay:150ms]">
        {ATTR_DEFS.map(({ key, label, abbr }) => (
          <StatCard key={key} abbr={abbr} label={label} value={attrs[key]} />
        ))}
      </section>

      {/* ── Info row ────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 animate-fade-in-up [animation-delay:220ms]">
        <InfoCard
          label="Karma Score"
          value={user.karmaScore}
        />
        <InfoCard
          label="Matches Played"
          value={user.matchesPlayed}
        />
        <InfoCard
          label="Position"
          value={positionLabel}
        />
      </section>
    </main>
  );
}
