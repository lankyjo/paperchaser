// Auto-save status; a failed save becomes a retry button.
export function SaveIndicator({ saveState, onRetry }: { saveState: 'saved' | 'saving' | 'failed'; onRetry: () => void }) {
  switch (saveState) {
    case 'saving':
      return <span className="text-[13px] text-muted-foreground">Saving…</span>
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
