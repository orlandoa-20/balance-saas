/**
 * Pure-SVG charts (server-renderable). Colors are CSS variable strings, so
 * they follow the light/dark theme with no client JS.
 */
import { PILLARS, getPillar, type PillarId } from "@/lib/constants/pillars";

export function Ring({
  value,
  size = 132,
  stroke = 12,
  color = "var(--evergreen)",
  caption,
  big,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  caption?: string;
  big?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className={className} style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-alt)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size * 0.26, lineHeight: 1, color: "var(--ink)" }}>
            {big ?? Math.round(value)}
          </div>
          {caption && <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600, marginTop: 3 }}>{caption}</div>}
        </div>
      </div>
    </div>
  );
}

export function Donut({
  segments,
  size = 150,
  stroke = 22,
  center,
}: {
  segments: { value: number; colorVar: string }[];
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-alt)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = c * (s.value / total);
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.colorVar}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {center && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>}
    </div>
  );
}

export interface WeekDay {
  label: string;
  byPillar: Record<PillarId, number>;
  total: number;
  today?: boolean;
}

export function WeeklyBars({ days, max }: { days: WeekDay[]; max?: number }) {
  const W = 520, H = 180, pad = 26, gap = 12;
  const n = days.length;
  const bw = (W - pad * 2 - gap * (n - 1)) / n;
  const chartH = H - 30;
  let topMax = max ?? Math.max(1, ...days.map((d) => d.total));
  topMax = Math.ceil(topMax / 2) * 2 || 2;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Heures par jour cette semaine">
      {days.map((d, i) => {
        const x = pad + i * (bw + gap);
        let y = chartH;
        const rects = PILLARS.map((p) => {
          const h = (d.byPillar[p.id] / topMax) * chartH;
          if (h < 0.5) return null;
          y -= h;
          return <rect key={p.id} x={x} y={y} width={bw} height={h} rx={3} fill={p.colorVar} />;
        });
        return (
          <g key={i}>
            {d.total === 0 && <rect x={x} y={chartH - 4} width={bw} height={4} rx={2} fill="var(--bg-alt)" />}
            {rects}
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fontWeight={d.today ? 700 : 500} fill={d.today ? "var(--evergreen-ink)" : "var(--ink-faint)"} fontFamily="var(--font-sans)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Legend({ ids }: { ids: PillarId[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 14 }}>
      {ids.map((id) => {
        const p = getPillar(id);
        return (
          <span key={id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.colorVar }} />
            {p.label}
          </span>
        );
      })}
    </div>
  );
}
