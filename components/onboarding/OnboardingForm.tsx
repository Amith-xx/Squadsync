"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import type { Position, OutfieldAttributes, GKAttributes } from "@/types";

const POSITIONS: { id: Position; label: string; description: string }[] = [
  { id: "GK", label: "Goalkeeper", description: "Last line of defence" },
  { id: "DEF", label: "Defender", description: "Protect the backline" },
  { id: "MID", label: "Midfielder", description: "Control the game" },
  { id: "FWD", label: "Forward", description: "Score the goals" },
];

const OUTFIELD_ATTRIBUTES: { key: keyof OutfieldAttributes; label: string; abbr: string; hint: string }[] = [
  { key: "pace",      label: "Pace",      abbr: "PAC", hint: "Sprint speed & acceleration" },
  { key: "shooting",  label: "Shooting",  abbr: "SHO", hint: "Finishing & shot power" },
  { key: "passing",   label: "Passing",   abbr: "PAS", hint: "Short & long passing" },
  { key: "defending", label: "Defending", abbr: "DEF", hint: "Tackling & positioning" },
  { key: "physical",  label: "Physical",  abbr: "PHY", hint: "Strength & stamina" },
];

const GK_ATTRIBUTES: { key: keyof GKAttributes; label: string; abbr: string; hint: string }[] = [
  { key: "diving",   label: "Diving",    abbr: "DIV", hint: "Diving range & timing" },
  { key: "reflex",   label: "Reflexes",  abbr: "REF", hint: "Shot-stopping reactions" },
  { key: "speed",    label: "Speed",     abbr: "SPD", hint: "Positioning & agility" },
  { key: "handling", label: "Handling",  abbr: "HAN", hint: "Ball security & catches" },
  { key: "physical", label: "Physical",  abbr: "PHY", hint: "Strength & stamina" },
];

function attrColor(value: number): string {
  if (value >= 85) return "#00e676";
  if (value >= 70) return "#22c55e";
  if (value >= 55) return "#fbbf24";
  return "#ef4444";
}

function sliderBackground(value: number): string {
  const pct = ((value - 40) / 60) * 100;
  const color = attrColor(value);
  return `linear-gradient(to right, ${color} ${pct}%, hsl(220 40% 14%) ${pct}%)`;
}

interface Props {
  initial?: {
    position?: Position;
    attributes?: Partial<OutfieldAttributes> & Partial<GKAttributes>;
    region?: string;
  };
  isEdit?: boolean;
}

export function OnboardingForm({ initial, isEdit = false }: Props) {
  const router = useRouter();

  const [position, setPosition] = useState<Position | null>(initial?.position ?? null);
  const [outfieldAttrs, setOutfieldAttrs] = useState<OutfieldAttributes>({
    pace:      initial?.attributes?.pace      ?? 60,
    shooting:  initial?.attributes?.shooting  ?? 60,
    passing:   initial?.attributes?.passing   ?? 60,
    defending: initial?.attributes?.defending ?? 60,
    physical:  initial?.attributes?.physical  ?? 60,
  });
  const [gkAttrs, setGkAttrs] = useState<GKAttributes>({
    diving:   initial?.attributes?.diving   ?? 60,
    reflex:   initial?.attributes?.reflex   ?? 60,
    speed:    initial?.attributes?.speed    ?? 60,
    handling: initial?.attributes?.handling ?? 60,
    physical: initial?.attributes?.physical ?? 60,
  });
  const [region, setRegion] = useState<string | null>(initial?.region ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAttrChange(key: string, value: number) {
    if (position === "GK") {
      setGkAttrs((prev) => ({ ...prev, [key]: value }));
    } else {
      setOutfieldAttrs((prev) => ({ ...prev, [key]: value }));
    }
  }

  async function handleSubmit() {
    if (!position) {
      setError("Please select your position before saving.");
      return;
    }
    if (!region) {
      setError("Please select your region before saving.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const attrs = position === "GK" ? gkAttrs : outfieldAttrs;
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, ...attrs, region }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Something went wrong.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const overall = position === "GK"
    ? Math.round((gkAttrs.diving + gkAttrs.reflex + gkAttrs.speed + gkAttrs.handling + gkAttrs.physical) / 5)
    : Math.round((outfieldAttrs.pace + outfieldAttrs.shooting + outfieldAttrs.passing + outfieldAttrs.defending + outfieldAttrs.physical) / 5);

  const activeAttrDefs = position === "GK" ? GK_ATTRIBUTES : OUTFIELD_ATTRIBUTES;
  const activeAttrs = position === "GK" ? gkAttrs : outfieldAttrs;

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          {isEdit ? "Update Your Profile" : "Set Up Your Match Profile"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isEdit
            ? "Adjust your position, attributes, and region at any time."
            : "Tell us about your game so we can match you fairly."}
        </p>
      </div>

      {/* Step 1 — Position */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neon-green">
          01 · Choose Your Position
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {POSITIONS.map((pos) => {
            const selected = position === pos.id;
            return (
              <button
                key={pos.id}
                onClick={() => setPosition(pos.id)}
                className={`
                  relative flex flex-col items-center gap-2 rounded-xl border px-4 py-5
                  text-left transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green
                  ${
                    selected
                      ? "border-neon-green bg-neon-green/10 shadow-[0_0_20px_rgba(0,230,115,0.2)]"
                      : "border-navy-border bg-navy-surface hover:border-neon-green/40 hover:bg-navy-dark"
                  }
                `}
              >
                {selected && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neon-green shadow-[0_0_6px_rgba(0,230,115,0.8)]" />
                )}
                <span
                  className={`text-2xl font-black tracking-tight ${
                    selected ? "text-neon-green text-glow" : "text-white"
                  }`}
                >
                  {pos.id}
                </span>
                <span className="text-xs font-semibold text-white">{pos.label}</span>
                <span className="text-center text-[10px] text-muted-foreground">
                  {pos.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — Attributes */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neon-green">
          02 · Rate Your Attributes
        </p>
        <div className="space-y-5">
          {activeAttrDefs.map(({ key, label, abbr, hint }) => {
            const value = (activeAttrs as unknown as Record<string, number>)[key] ?? 60;
            const color = attrColor(value);
            return (
              <div key={key} className="rounded-xl border border-navy-border bg-navy-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold tracking-widest text-muted-foreground">
                        {abbr}
                      </span>
                      <span className="text-sm font-semibold text-white">{label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{ color }}
                  >
                    {value}
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(e) =>
                    handleAttrChange(key as string, parseInt(e.target.value, 10))
                  }
                  className="attr-slider"
                  style={{ background: sliderBackground(value) }}
                  aria-label={`${label} rating`}
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>40</span>
                  <span>100</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 3 — Region */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neon-green">
          03 · Your Region
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          We use this to match you with players in your area.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REGIONS.map((r) => {
            const selected = region === r.code;
            return (
              <button
                key={r.code}
                onClick={() => setRegion(r.code)}
                className={`
                  rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green
                  ${
                    selected
                      ? "border-neon-green bg-neon-green/10 text-neon-green shadow-[0_0_14px_rgba(0,230,115,0.2)]"
                      : "border-navy-border bg-navy-surface text-white hover:border-neon-green/40 hover:bg-navy-dark"
                  }
                `}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Overall preview */}
      <div className="flex items-center justify-between rounded-xl border border-neon-green/30 bg-neon-green/5 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your Overall Rating
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Average of your 5 attributes
          </p>
        </div>
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-neon-green shadow-[0_0_20px_rgba(0,230,115,0.4)]">
          <span className="text-2xl font-black leading-none text-navy-darkest">
            {overall}
          </span>
          <span className="text-[9px] font-bold text-navy-darkest/70 uppercase tracking-wider">
            OVR
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !position || !region}
        className="
          w-full rounded-xl bg-neon-green px-6 py-4 text-sm font-bold text-navy-darkest
          transition-all duration-200
          hover:bg-neon-green/90 hover:shadow-[0_0_24px_rgba(0,230,115,0.4)]
          disabled:cursor-not-allowed disabled:opacity-50
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green
        "
      >
        {loading ? "Saving…" : isEdit ? "Update Profile" : "Save Profile & Enter"}
      </button>
    </div>
  );
}
