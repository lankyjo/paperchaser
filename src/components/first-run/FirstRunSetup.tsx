import type { Company } from '../../document/types'
import { CompanyProfileForm } from '../company/CompanyProfileForm'

// First-launch card: your business details, which every document prints as the sender, then a sample project to explore.
export function FirstRunSetup({ onFinish }: { onFinish: (company: Company) => void }) {
  return (
    <section aria-label="Set up your business" className="rounded-lg border bg-card p-4">
      <h2 className="font-medium">Welcome to Paperchaser</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Add your business details. They appear as the sender on every document, and you can change them later in Settings. A sample project with every document type is added so you can look around; delete it whenever you like.
      </p>
      <CompanyProfileForm submitLabel="Save and add sample project" onSave={onFinish} />
    </section>
  )
}
