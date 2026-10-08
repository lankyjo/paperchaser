import { ArrowRight } from 'lucide-react'
import type { Company } from '../../document/types'
import { HOME_COPY } from '../../strings/home'
import { useCompanyProfileForm } from '../company/useCompanyProfileForm'
import { Button } from '../ui/button'

const LABEL = 'text-[12.5px] font-medium text-muted-foreground'
const FIELD = 'w-full rounded-lg border border-input bg-background px-3 text-[14px] text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground/50 focus:border-ring focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_25%,transparent)]'

// The four essentials for a first document (name, email, address, payment); tax ID and logos wait for Settings.
export function WelcomeForm({ onSave }: { onSave: (company: Company) => void }) {
  const form = useCompanyProfileForm(undefined, onSave)
  return (
    <form onSubmit={form.submit} className="grid gap-4">
      <label className="grid gap-1.5">
        <span className={LABEL}>Business name</span>
        <input className={`${FIELD} h-10`} value={form.name} onChange={(e) => form.setName(e.target.value)} placeholder="Halden & Co." required />
      </label>
      <label className="grid gap-1.5">
        <span className={LABEL}>Email</span>
        <input className={`${FIELD} h-10`} type="email" value={form.email} onChange={(e) => form.setEmail(e.target.value)} placeholder="hello@yourstudio.com" />
      </label>
      <label className="grid gap-1.5">
        <span className={LABEL}>Address</span>
        <textarea className={`${FIELD} min-h-20 resize-y py-2.5 leading-snug`} value={form.address} onChange={(e) => form.setAddress(e.target.value)} placeholder="Street, city, postcode" />
      </label>
      <label className="grid gap-1.5">
        <span className={LABEL}>Payment details</span>
        <textarea className={`${FIELD} min-h-20 resize-y py-2.5 leading-snug`} value={form.payment} onChange={(e) => form.setPayment(e.target.value)} placeholder="Bank, IBAN or sort code" />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-9 bg-gold px-4 text-[oklch(0.2_0.008_60)] hover:bg-gold/90">
          {HOME_COPY.setupSubmit}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-[12.5px] text-muted-foreground">{HOME_COPY.setupHint}</span>
      </div>
    </form>
  )
}
