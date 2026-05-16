"use client";

interface Props {
  abbr: string;
  label: string;
  value: number;
  size?: number;
}

function arcColor(value: number): string {
  if (value >= 85) return "#00e676";
  if (value >= 70) return "#22c55e";
  if (value >= 55) return "#fbbf24";
  return "#ef4444";
}

export function AttributeCircle({ abbr, label, value, size = 76 }: Props) {
  const r = 28;
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r; // ≈ 175.93
  const arc = (value / 100) * circumference;
  const color = arcColor(value);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Abbreviation label above circle */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {abbr}
      </span>

      {/* SVG circular gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 80 80" width={size} height={size} aria-label={`${label}: ${value}`}>
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(220 40% 14%)"
            strokeWidth="6"
          />
          {/* Value arc — starts at 12 o'clock via rotate(-90) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${arc} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.4s ease" }}
          />
        </svg>
        {/* Value number centered inside */}
        <span
          className="absolute inset-0 flex items-center justify-center text-lg font-black tabular-nums"
          style={{ color }}
        >
          {value}
        </span>
      </div>

      {/* Full label below */}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
