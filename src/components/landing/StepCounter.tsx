// "04 / 10" with a gold progress bar.
export function StepCounter({ index, total, className = '' }: { index: number; total: number; className?: string }) {
  return (
    <span className={`lp-count ${className}`}>
      <span>{String(index + 1).padStart(2, '0')} / {total}</span>
      <i><b style={{ transform: `scaleX(${(index + 1) / total})` }} /></i>
    </span>
  )
}
