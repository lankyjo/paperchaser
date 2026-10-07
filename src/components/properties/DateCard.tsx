import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

// A titled date field in the properties pane, e.g. a quote's valid-until or an invoice's due date.
export function DateCard({ title, value, onChange }: { title: string; value: string | undefined; onChange: (date: string | undefined) => void }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Input aria-label={title} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />
      </CardContent>
    </Card>
  )
}
