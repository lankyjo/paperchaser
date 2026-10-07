import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

// The last day a quote can be accepted; after it the quote shows as expired.
export function ValidUntilCard({ validUntil, onChange }: { validUntil: string | undefined; onChange: (date: string | undefined) => void }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Valid until</CardTitle>
      </CardHeader>
      <CardContent>
        <Input aria-label="Valid until" type="date" value={validUntil ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />
      </CardContent>
    </Card>
  )
}
