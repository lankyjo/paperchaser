import { isValidLocale } from '../../lib/isValidLocale'
import { Label } from '../ui/label'

const CURRENCIES = Intl.supportedValuesOf('currency')
const currencyName = new Intl.DisplayNames(['en'], { type: 'currency' })

interface CurrencyLocaleFieldsProps {
  currency: string
  locale: string
  currencyLocked: boolean
  onCurrencyChange: (currency: string) => void
  onLocaleChange: (locale: string) => void
}

// Project currency (any ISO code, locked once money documents are sent) and the locale used for dates and numbers.
export function CurrencyLocaleFields({ currency, locale, currencyLocked, onCurrencyChange, onLocaleChange }: CurrencyLocaleFieldsProps) {
  return (
    <>
      <div className="grid gap-1">
        <Label htmlFor="project-currency">Currency</Label>
        <select
          id="project-currency"
          className="h-8 rounded-md border bg-transparent px-2 text-sm disabled:opacity-60"
          value={currency}
          disabled={currencyLocked}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code} — {currencyName.of(code)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-locale">Number and date format</Label>
        <input
          id="project-locale"
          className="h-8 rounded-md border bg-transparent px-2 text-sm aria-invalid:border-destructive"
          value={locale}
          aria-invalid={!isValidLocale(locale)}
          onChange={(e) => onLocaleChange(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">For example en-US, en-GB, de-DE or fr-FR.</p>
      </div>
    </>
  )
}
