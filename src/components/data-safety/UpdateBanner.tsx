import { useSyncExternalStore } from 'react'
import { updateStore } from '../../app/updateStore'
import { Button } from '../ui/button'

// Offers a waiting app update; it only applies when clicked, so nothing reloads mid-edit.
export function UpdateBanner() {
  const ready = useSyncExternalStore(updateStore.subscribe, updateStore.isReady)
  if (!ready) return null
  return (
    <div role="status" className="mx-auto mb-4 flex max-w-2xl items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 text-sm print:hidden">
      A new version of Paperchaser is ready.
      <Button size="sm" onClick={() => void import('../../app/pwa').then(({ updateSW }) => updateSW(true))}>
        Update now
      </Button>
    </div>
  )
}
