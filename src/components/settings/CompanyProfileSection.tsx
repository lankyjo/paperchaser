import { useState } from 'react'
import { CompanyProfileForm } from '../company/CompanyProfileForm'
import { useCompanyProfile } from '../company/useCompanyProfile'

// Edit the business details every draft prints as the sender; sent documents keep the details they were sent with.
export function CompanyProfileSection() {
  const { company, save } = useCompanyProfile()
  const [saved, setSaved] = useState(false)
  if (company === undefined) return null
  return (
    <section aria-label="Company profile" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 className="font-medium">Company profile</h2>
      <CompanyProfileForm initial={company ?? undefined} submitLabel="Save company profile" onSave={(next) => void save(next).then(() => setSaved(true))} />
      {saved && <p role="status" className="text-sm">Saved. Drafts now use these details; sent documents keep theirs.</p>}
    </section>
  )
}
