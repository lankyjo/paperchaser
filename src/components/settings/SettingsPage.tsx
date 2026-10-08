import { Link } from '@tanstack/react-router'
import { DOC_TITLES } from '../../document/tokens'
import { nextNumber } from '../../document/finalize'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AccountantExport } from './AccountantExport'
import { AiSettingsSection } from './AiSettingsSection'
import { useAiSettings } from './useAiSettings'
import { BackupSection } from './BackupSection'
import { CompanyProfileSection } from './CompanyProfileSection'
import { useNumbering } from './useNumbering'

// Numbering settings: prefix (with {YYYY}), next number and yearly reset per numbered document type.
export function SettingsPage() {
  const { counters, change, save, reusesNumbers } = useNumbering()
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <Link to="/app" className="text-sm underline">
        Projects
      </Link>
      <CompanyProfileSection />
      <h1 className="text-xl font-semibold">Numbering</h1>
      <p className="text-sm text-muted-foreground">Numbers are assigned when a document is finalized. Use {'{YYYY}'} in a prefix for the year.</p>
      <ul className="flex flex-col gap-3">
        {counters?.map((counter) => (
          <li key={counter.type} aria-label={DOC_TITLES[counter.type]} className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_8rem_auto]">
            <h2 className="font-medium sm:col-span-3">
              {DOC_TITLES[counter.type]} <span className="text-sm text-muted-foreground">next: {nextNumber(counter, new Date()).number}</span>
            </h2>
            <Input aria-label="Prefix" value={counter.prefix} onChange={(e) => change({ ...counter, prefix: e.target.value })} />
            <Input aria-label="Next number" type="number" min={1} value={counter.next} onChange={(e) => change({ ...counter, next: Math.max(1, Number(e.target.value) || 1) })} />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={counter.yearlyReset} onChange={(e) => change({ ...counter, yearlyReset: e.target.checked, year: new Date().getFullYear() })} />
              Restart each year
            </label>
            {reusesNumbers(counter) && <p role="alert" className="text-xs text-destructive sm:col-span-3">This is lower than numbers already used, so documents could get duplicate numbers.</p>}
          </li>
        ))}
      </ul>
      <Button onClick={() => void save()}>Save numbering</Button>
      <BackupSection />
      <AccountantExport />
      <AiSettingsSection ai={useAiSettings()} />
    </main>
  )
}
