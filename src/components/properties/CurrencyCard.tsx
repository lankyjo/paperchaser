import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

// The document's currency, which is set on the project so every document in it agrees.
export function CurrencyCard({ currency }: { currency: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Currency</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{currency}</p>
        <p className="text-xs text-muted-foreground">Change it on the project page.</p>
      </CardContent>
    </Card>
  )
}
