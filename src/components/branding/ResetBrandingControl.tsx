import { useState } from 'react'
import type { TemplateId } from '../../document/types'
import { Button } from '../ui/button'

// Clears all branding overrides back to the template defaults after an inline confirmation.
export function ResetBrandingControl({ template, onReset }: { template: TemplateId; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const templateName = template.charAt(0).toUpperCase() + template.slice(1)

  return confirming ? (
    <div className="space-y-2 rounded-lg border border-destructive/40 p-2">
      <p className="text-sm font-medium">Reset branding?</p>
      <p className="text-xs text-muted-foreground">
        Returns colors, fonts, and header/footer to the {templateName} defaults.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => {
            onReset()
            setConfirming(false)
          }}
        >
          Reset
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => setConfirming(true)}>
      Reset branding
    </Button>
  )
}
