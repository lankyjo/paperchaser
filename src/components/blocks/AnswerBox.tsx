// A printable tick box: empty for the client to fill by hand, ticked once an answer is logged; clickable while editing.
export function AnswerBox({ label, filled, onToggle }: { label: string; filled: boolean; onToggle?: () => void }) {
  const box = (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', width: '12px', height: '12px', border: '1px solid var(--tpl-ink)', alignItems: 'center', justifyContent: 'center', fontSize: '10px', lineHeight: 1 }}
    >
      {filled ? '✓' : ''}
    </span>
  )
  if (!onToggle) return box
  return (
    <button type="button" aria-label={label} aria-pressed={filled} onClick={onToggle} style={{ display: 'inline-flex', padding: 0, background: 'none', border: 0 }}>
      {box}
    </button>
  )
}
