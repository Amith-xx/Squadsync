interface Props {
  label: string;
  abbr: string;
  value: number;
}

function valueColor(value: number): string {
  if (value >= 85) return "#00e676";
  if (value >= 70) return "#22c55e";
  if (value >= 55) return "#fbbf24";
  return "#ef4444";
}

export function StatCard({ label, abbr, value }: Props) {
  const color = valueColor(value);

  return (
    <div className="flex flex-col rounded-xl border border-navy-border bg-navy-dark px-4 py-4 transition-colors hover:border-navy-border/80">
      {/* Abbr above, label below */}
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {abbr}
      </span>
      <span className="mb-1 text-[9px] text-muted-foreground/60">{label}</span>

      {/* Value */}
      <span
        className="text-3xl font-black leading-none tabular-nums"
        style={{ color }}
      >
        {value}
      </span>

      {/* Coloured underline */}
      <div className="mt-3 h-[2px] w-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}

export function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-navy-border bg-navy-dark px-4 py-4">
      <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  );
}
