import type { DocumentModel } from '../../document/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type Currency = DocumentModel['currency']

// ponytail: display-only switch; the rate fetch is informational and stored minor units never change
function switchCurrency(from: Currency, to: Currency, onCurrencyChange?: (currency: Currency) => void) {
  const doSwitch = () => onCurrencyChange?.(to)
  fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
    .then((r) => r.json())
    .then(() => doSwitch())
    .catch(() => doSwitch())
  // Switch anyway if the rate request hangs.
  setTimeout(doSwitch, 300)
}

// Document currency picker.
export function CurrencyCard({
  currency,
  onCurrencyChange,
}: {
  currency: Currency
  onCurrencyChange?: (currency: Currency) => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Currency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select
          value={currency}
          onValueChange={(next) => {
            if (next !== null && (next === 'EUR' || next === 'JPY') && next !== currency) switchCurrency(currency, next, onCurrencyChange)
          }}
        >
          <SelectTrigger className="w-full" aria-label="Currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">EUR — Euro (2dp)</SelectItem>
            <SelectItem value="JPY">JPY — Yen (0dp)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">EUR uses 2 decimals, JPY uses 0. Stored amounts keep their minor units.</p>
      </CardContent>
    </Card>
  )
}
