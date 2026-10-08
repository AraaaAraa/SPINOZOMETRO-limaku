type GaugeProps = { value: number; min?: number; max?: number; leftLabel?: string; rightLabel?: string };

const CX = 100, CY = 100, R = 80, SEGS = 30;
const pt = (a: number, r = R) => [CX + r * Math.cos(a), CY - r * Math.sin(a)];

/** Velocímetro semicircular rojo→verde con aguja (infografía PAG). */
export default function gaugeSemi({ value, min = 0, max = 10, leftLabel, rightLabel }: GaugeProps) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const needle = pt(Math.PI * (1 - t), R - 12);
  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 200 125" role="img" aria-label={`Valor ${value.toFixed(2)} de ${max}`}>
        {Array.from({ length: SEGS }, (_, i) => {
          const [x0, y0] = pt(Math.PI * (1 - i / SEGS));
          const [x1, y1] = pt(Math.PI * (1 - (i + 1) / SEGS));
          return <path key={i} d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={`hsl(${(i / (SEGS - 1)) * 130} 75% 45%)`} strokeWidth={14} fill="none" />;
        })}
        <line x1={CX} y1={CY} x2={needle[0]} y2={needle[1]} stroke="#0b3d63" strokeWidth={3} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={6} fill="#0b3d63" />
        <text x={CX - R} y={118} fontSize={8} textAnchor="start" fill="#0b3d63">Inicio</text>
        <text x={CX + R} y={118} fontSize={8} textAnchor="end" fill="#0b3d63">Máximo impacto</text>
        <text x={CX} y={84} fontSize={20} fontWeight={700} textAnchor="middle" fill="#0b3d63">{value.toFixed(2).replace(".", ",")}</text>
      </svg>
      {(leftLabel || rightLabel) && (
        <figcaption className="flex justify-between text-xs font-semibold">
          <span>↗ {leftLabel}</span>
          <span>{rightLabel} 🕊️</span>
        </figcaption>
      )}
    </figure>
  );
}

/** Anillo de progreso (resultado del Spinozómetro, como en la landing actual). */
export function Ring({ value, max = 100, color = "#6bb34a" }: { value: number; max?: number; color?: string }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="-rotate-90" role="img" aria-label={`${value} de ${max}`}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e5eef0" strokeWidth={10} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value / max))} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-bold">{value}/{max}</span>
    </div>
  );
}