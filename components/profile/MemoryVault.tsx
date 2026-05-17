"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { MemoryClient } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  playerOfMatch: string;
  competition: string;
  matchDate: string;
  favoriteMoment: string;
  note: string;
}

const EMPTY_FORM: FormData = {
  teamA: "", teamB: "", scoreA: "0", scoreB: "0",
  playerOfMatch: "", competition: "", matchDate: "",
  favoriteMoment: "", note: "",
};

function memoryToForm(m: MemoryClient): FormData {
  return {
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: String(m.scoreA),
    scoreB: String(m.scoreB),
    playerOfMatch: m.playerOfMatch,
    competition: m.competition,
    matchDate: m.matchDate ? m.matchDate.slice(0, 10) : "",
    favoriteMoment: m.favoriteMoment,
    note: m.note,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 13) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatMatchDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Football Icon ─────────────────────────────────────────────────────────────

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className ?? "h-6 w-6"}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="3" fill="none" />
      <polygon
        points="32,8 40,24 56,24 44,36 48,52 32,42 16,52 20,36 8,24 24,24"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

// ─── Score Input ──────────────────────────────────────────────────────────────

function ScoreInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-14 rounded-xl border border-navy-border bg-navy-surface text-center text-2xl font-black text-white outline-none transition-colors focus:border-neon-green/50"
      />
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-neon-green">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-navy-border bg-navy-surface px-3 py-2.5 text-sm text-white placeholder-muted-foreground/40 outline-none transition-colors focus:border-neon-green/50";

const textareaCls =
  "w-full rounded-xl border border-navy-border bg-navy-surface px-3 py-2.5 text-sm text-white placeholder-muted-foreground/40 outline-none transition-colors focus:border-neon-green/50 resize-none";

// ─── Memory Form ──────────────────────────────────────────────────────────────

function MemoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormData;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.teamA.trim() || !form.teamB.trim() || !form.favoriteMoment.trim()) {
      setError("Team names and Favourite Moment are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={topRef} className="animate-fade-in-up rounded-2xl border border-neon-green/20 bg-navy-dark p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FootballIcon className="h-5 w-5 text-neon-green" />
          <h3 className="text-base font-black text-white">
            {initial === EMPTY_FORM ? "Add Memory" : "Edit Memory"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-navy-surface hover:text-white"
          aria-label="Close form"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* Teams & Score */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[120px]">
            <Field label="Team A" required>
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. Barcelona"
                value={form.teamA}
                onChange={(e) => set("teamA", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <ScoreInput label="Score" value={form.scoreA} onChange={(v) => set("scoreA", v)} />
            <span className="pb-3 text-xl font-black text-muted-foreground">–</span>
            <ScoreInput label="Score" value={form.scoreB} onChange={(v) => set("scoreB", v)} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Field label="Team B" required>
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. Real Madrid"
                value={form.teamB}
                onChange={(e) => set("teamB", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Competition + Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Competition (optional)">
            <input
              type="text"
              maxLength={100}
              placeholder="e.g. UCL Final, World Cup"
              value={form.competition}
              onChange={(e) => set("competition", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Match Date (optional)">
            <input
              type="date"
              value={form.matchDate}
              onChange={(e) => set("matchDate", e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
            />
          </Field>
        </div>

        {/* Player of the match */}
        <Field label="Player of the Match (optional)">
          <input
            type="text"
            maxLength={80}
            placeholder="e.g. Lionel Messi"
            value={form.playerOfMatch}
            onChange={(e) => set("playerOfMatch", e.target.value)}
            className={inputCls}
          />
        </Field>

        {/* Favourite moment */}
        <Field label="Favourite Moment" required>
          <textarea
            maxLength={500}
            rows={3}
            placeholder="What made this match unforgettable? Describe your favourite moment..."
            value={form.favoriteMoment}
            onChange={(e) => set("favoriteMoment", e.target.value)}
            className={textareaCls}
          />
          <p className="text-right text-[10px] text-muted-foreground/50">
            {form.favoriteMoment.length}/500
          </p>
        </Field>

        {/* Personal note */}
        <Field label="Personal Note (optional)">
          <textarea
            maxLength={1000}
            rows={3}
            placeholder="Where were you? Who did you watch with? Your personal story..."
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            className={textareaCls}
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-navy-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-neon-green px-5 py-2 text-sm font-black text-navy-darkest transition-all hover:bg-neon-green/90 hover:shadow-[0_0_20px_rgba(0,230,115,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-darkest/30 border-t-navy-darkest" />
                Saving…
              </>
            ) : (
              <>
                <FootballIcon className="h-3.5 w-3.5" />
                Save Memory
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Memory Card ──────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  index,
  onEdit,
  onDelete,
}: {
  memory: MemoryClient;
  index: number;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  const delay = `${Math.min(index * 80, 400)}ms`;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-navy-border bg-navy-dark transition-all duration-300 hover:border-neon-green/20 hover:shadow-[0_0_24px_rgba(0,230,115,0.06)] animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      {/* Gradient accent top line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-neon-green/60 via-neon-green/20 to-transparent" />

      <div className="p-5">
        {/* Card header: competition + date */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {memory.competition && (
              <span className="inline-flex items-center gap-1 rounded-full border border-neon-green/25 bg-neon-green/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon-green">
                <FootballIcon className="h-2.5 w-2.5" />
                {memory.competition}
              </span>
            )}
            {memory.matchDate && (
              <span className="text-[10px] font-semibold text-muted-foreground">
                {formatMatchDate(memory.matchDate)}
              </span>
            )}
          </div>

          {/* Edit/delete controls — visible on mobile, hover-reveal on desktop */}
          <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-navy-surface hover:text-neon-green"
              aria-label="Edit memory"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
              aria-label="Delete memory"
            >
              {deleting ? (
                <span className="h-3.5 w-3.5 block animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Score display */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="flex-1 text-right text-base font-black leading-tight text-white sm:text-lg">
            {memory.teamA}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-surface text-xl font-black tabular-nums text-neon-green shadow-[inset_0_0_12px_rgba(0,230,115,0.08)]">
              {memory.scoreA}
            </span>
            <span className="text-sm font-black text-muted-foreground">–</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-surface text-xl font-black tabular-nums text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.03)]">
              {memory.scoreB}
            </span>
          </div>
          <p className="flex-1 text-left text-base font-black leading-tight text-white sm:text-lg">
            {memory.teamB}
          </p>
        </div>

        {/* Player of the match */}
        {memory.playerOfMatch && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            <p className="text-xs text-muted-foreground">
              Player of the Match:{" "}
              <span className="font-bold text-white">{memory.playerOfMatch}</span>
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="mb-3 h-px bg-navy-border" />

        {/* Favourite moment */}
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neon-green/80">
            ⚽ Favourite Moment
          </p>
          <p
            className={`text-sm italic leading-relaxed text-white/90 transition-all ${
              !expanded && memory.favoriteMoment.length > 140 ? "line-clamp-3" : ""
            }`}
          >
            &ldquo;{memory.favoriteMoment}&rdquo;
          </p>
        </div>

        {/* Personal note */}
        {memory.note && (
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Personal Note
            </p>
            <p
              className={`text-xs leading-relaxed text-muted-foreground ${
                !expanded && memory.note.length > 120 ? "line-clamp-2" : ""
              }`}
            >
              {memory.note}
            </p>
          </div>
        )}

        {/* Expand / collapse toggle */}
        {(memory.favoriteMoment.length > 140 || memory.note.length > 120) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mb-2 text-[10px] font-bold text-neon-green/70 transition-colors hover:text-neon-green"
          >
            {expanded ? "Show less ↑" : "Read more ↓"}
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/40">{timeAgo(memory.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-border py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-neon-green/20 bg-neon-green/5">
        <FootballIcon className="h-8 w-8 text-neon-green/60" />
      </div>
      <p className="text-sm font-bold text-white">No memories yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Save your favourite real-world football matches — classic finals, local derbies, historic moments.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 flex items-center gap-2 rounded-xl bg-neon-green/10 border border-neon-green/20 px-4 py-2 text-sm font-bold text-neon-green transition-all hover:bg-neon-green/20"
      >
        <span>+</span>
        Add Your First Memory
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialMemories: MemoryClient[];
}

type FormMode = "hidden" | "add" | "edit";

export function MemoryVault({ initialMemories }: Props) {
  const [memories, setMemories] = useState<MemoryClient[]>(initialMemories);
  const [formMode, setFormMode] = useState<FormMode>("hidden");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<FormData>(EMPTY_FORM);

  const showingForm = formMode !== "hidden";

  function openAdd() {
    setEditingId(null);
    setEditingForm(EMPTY_FORM);
    setFormMode("add");
  }

  function openEdit(memory: MemoryClient) {
    setEditingId(memory.id);
    setEditingForm(memoryToForm(memory));
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode("hidden");
    setEditingId(null);
    setEditingForm(EMPTY_FORM);
  }

  const handleSave = useCallback(
    async (data: FormData) => {
      const body = {
        teamA: data.teamA,
        teamB: data.teamB,
        scoreA: parseInt(data.scoreA, 10),
        scoreB: parseInt(data.scoreB, 10),
        playerOfMatch: data.playerOfMatch,
        competition: data.competition,
        matchDate: data.matchDate || null,
        favoriteMoment: data.favoriteMoment,
        note: data.note,
      };

      if (formMode === "edit" && editingId) {
        const res = await fetch(`/api/memories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json() as { success: boolean; data?: MemoryClient; error?: string };
        if (!json.success) throw new Error(json.error ?? "Failed to save");
        if (json.data) {
          const saved = json.data;
          setMemories((prev) => prev.map((m) => m.id === editingId ? saved : m));
        }
      } else {
        const res = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json() as { success: boolean; data?: MemoryClient; error?: string };
        if (!json.success) throw new Error(json.error ?? "Failed to save");
        if (json.data) {
          const created = json.data;
          setMemories((prev) => [created, ...prev]);
        }
      }

      closeForm();
    },
    [formMode, editingId]
  );

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    const json = await res.json() as { success: boolean; error?: string };
    if (!json.success) throw new Error(json.error ?? "Failed to delete");
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <section className="animate-fade-in-up [animation-delay:360ms]">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FootballIcon className="h-5 w-5 text-neon-green" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Football Memory Vault
            </p>
            <p className="text-xs text-muted-foreground/60">
              {memories.length > 0
                ? `${memories.length} saved ${memories.length === 1 ? "memory" : "memories"}`
                : "Save your favourite real-world matches"}
            </p>
          </div>
        </div>

        {!showingForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl border border-neon-green/25 bg-neon-green/8 px-3 py-1.5 text-xs font-bold text-neon-green transition-all hover:border-neon-green/50 hover:bg-neon-green/15"
          >
            <span className="text-base leading-none">+</span>
            Add Memory
          </button>
        )}
      </div>

      {/* Form (add or edit) */}
      {showingForm && (
        <div className="mb-4">
          <MemoryForm
            initial={editingForm}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </div>
      )}

      {/* Memory cards gallery */}
      {memories.length === 0 && !showingForm ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="space-y-3">
          {memories.map((memory, i) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              index={i}
              onEdit={() => openEdit(memory)}
              onDelete={() => handleDelete(memory.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
