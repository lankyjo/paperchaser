import type { SaveState } from '../edit/useAutoSave'
// Auto-save status; a failed save becomes a retry button.
export function SaveIndicator({ saveState, onRetry }: { saveState: SaveState; onRetry: () => void }) {
  switch (saveState) {
    case 'saving':
      return <span className="text-[13px] text-muted-foreground">Saving…</span>
    case 'stale':
      return (
        <button type="button" onClick={() => window.location.reload()} className="rounded bg-destructive px-2 py-0.5 text-[13px] font-medium text-destructive-foreground">
          Changed in another tab — reload
        </button>
      )
    case 'failed':
      return (
        <button
          type="button"
          onClick={onRetry}
          className="rounded bg-destructive px-2 py-0.5 text-[13px] font-medium text-destructive-foreground"
        >
          Not saved — retry
        </button>
      )
    default:
      return <span className="text-[13px] text-muted-foreground">Saved</span>
  }
}
