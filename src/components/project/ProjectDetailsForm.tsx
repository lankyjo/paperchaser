import { useState, type FormEvent } from 'react'
import { minorToRaw, parseToMinor } from '../../document/money'
import type { TaxMode } from '../../document/totals'
import type { Project } from '../../project/project'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { isValidLocale } from '../../lib/isValidLocale'
import { CurrencyLocaleFields } from './CurrencyLocaleFields'

// Title, fee, dates and deliverables shared by every document in the project.
const TAX_MODES: { value: TaxMode; label: string }[] = [
  { value: 'exclusive', label: 'Prices exclude tax' },
  { value: 'inclusive', label: 'Prices include tax' },
  { value: 'none', label: 'No tax' },
]

export function ProjectDetailsForm({ project, taxModeLocked, onSave }: { project: Project; taxModeLocked: boolean; onSave: (next: Project) => void }) {
  const [title, setTitle] = useState(project.title)
  const [currency, setCurrency] = useState(project.currency ?? 'EUR')
  const [locale, setLocale] = useState(project.locale ?? navigator.language)
  const [fee, setFee] = useState(project.feeMinor === undefined ? '' : minorToRaw(project.feeMinor, currency, locale))
  const [startDate, setStartDate] = useState(project.startDate ?? '')
  const [dueDate, setDueDate] = useState(project.dueDate ?? '')
  const [deliverables, setDeliverables] = useState((project.deliverables ?? []).join('\n'))
  const [taxMode, setTaxMode] = useState<TaxMode>(project.taxMode ?? 'exclusive')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({
      ...project,
      title: title.trim(),
      feeMinor: parseToMinor(fee, currency, locale) ?? undefined,
      currency,
      locale: isValidLocale(locale) ? locale : project.locale,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      deliverables: deliverables.split('\n').map((l) => l.trim()).filter(Boolean),
      taxMode,
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="project-title">Title</Label>
        <Input id="project-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-fee">Project fee</Label>
        <Input id="project-fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
      </div>
      <CurrencyLocaleFields
        currency={currency}
        locale={locale}
        currencyLocked={taxModeLocked}
        onCurrencyChange={setCurrency}
        onLocaleChange={setLocale}
      />
      <div className="grid gap-1">
        <Label htmlFor="project-tax">Tax</Label>
        <select
          id="project-tax"
          className="h-8 rounded-md border bg-transparent px-2 text-sm disabled:opacity-60"
          value={taxMode}
          disabled={taxModeLocked}
          onChange={(e) => setTaxMode(e.target.value as TaxMode)}
        >
          {TAX_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        {taxModeLocked && <p className="text-[11px] text-muted-foreground">Locked because a money document has been sent.</p>}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-start">Start date</Label>
        <Input id="project-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-due">Due date</Label>
        <Input id="project-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="project-deliverables">Deliverables (one per line)</Label>
        <textarea
          id="project-deliverables"
          className="min-h-20 rounded-md border bg-transparent px-3 py-2 text-sm"
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
        />
      </div>
      <Button type="submit" className="sm:col-span-2">
        Save project
      </Button>
    </form>
  )
}
