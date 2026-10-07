// Plain SVG bar chart so it prints crisply at any size.
export function BarChart({ series }: { series: { label: string; value: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.value))
  const barWidth = 100 / Math.max(series.length, 1)
  return (
    <svg viewBox="0 0 100 50" width="100%" role="img" aria-label="Bar chart" style={{ display: 'block' }}>
      {series.map((s, i) => {
        const h = (Math.max(s.value, 0) / max) * 40
        return (
          <g key={i}>
            <rect x={i * barWidth + barWidth * 0.15} y={42 - h} width={barWidth * 0.7} height={h} fill="var(--tpl-primary)" />
            <text x={i * barWidth + barWidth / 2} y={48} fontSize="3" textAnchor="middle" fill="var(--tpl-ink)">
              {s.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
