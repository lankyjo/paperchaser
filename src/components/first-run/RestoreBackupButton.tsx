import { useRef } from 'react'
import { HOME_COPY } from '../../strings/home'
import { Button } from '../ui/button'
import { useWelcomeRestore } from './useWelcomeRestore'

// For a new device: pick a backup file instead of typing the business details again.
export function RestoreBackupButton({ onRestored }: { onRestored: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const { restore, error } = useWelcomeRestore(onRestored)
  return (
    <div className="mt-6 grid justify-items-start gap-2">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => input.current?.click()}>
        {HOME_COPY.restore}
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label="Backup file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void restore(file)
          // Lets the same file be picked again after an error.
          e.target.value = ''
        }}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
