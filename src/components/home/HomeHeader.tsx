import { useCompanyProfile } from '../company/useCompanyProfile'
import { getPlainText } from '../../document/richtext'
import { useBackup } from '../settings/useBackup'

const DAY_MS = 86_400_000

// How long ago the last backup was, in words.
const backupAge = (at: string | null | undefined) => {
  if (at === undefined) return ''
  if (at === null) return 'no backup yet'
  const days = Math.floor((Date.now() - Date.parse(at)) / DAY_MS)
  return days === 0 ? 'backed up today' : days === 1 ? 'backed up yesterday' : `backed up ${days} days ago`
}

// The studio name beside the gold mark, and whether the data is safe.
export function HomeHeader() {
  const { company } = useCompanyProfile()
  const { lastBackupAt } = useBackup()
  return (
    <header className="flex flex-wrap items-center gap-2.5">
      <span aria-hidden="true" className="size-5.5 rounded-md bg-gold" />
      <h1 className="font-semibold">{(company && getPlainText(company.name)) || 'Paperchaser'}</h1>
      <span className="ml-auto inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
        Saved on this device{lastBackupAt !== undefined && ` · ${backupAge(lastBackupAt)}`}
      </span>
    </header>
  )
}
