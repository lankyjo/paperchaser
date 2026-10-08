import { ArrowRight } from 'lucide-react'
import type { Company } from '../../document/types'
import { HOME_COPY } from '../../strings/home'
import { useCompanyProfileForm } from '../company/useCompanyProfileForm'
import { Button } from '../ui/button'

// One ledger row: small-caps label on the left, the value on the right, a hairline that turns gold while typing.
const ROW = 'group grid gap-1.5 border-b border-border py-4 transition-colors focus-within:border-gold sm:grid-cols-[132px_1fr] sm:items-baseline sm:gap-6'
const LABEL = 'text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors group-focus-within:text-gold'
const VALUE = 'w-full resize-none border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60'

// The four essentials as a ledger on the dark pane; tax ID and logos wait for Settings.
export function WelcomeForm({ onSave }: { onSave: (company: Company) => void }) {
  const form = useCompanyProfileForm(undefined, onSave)
  return (
    <form onSubmit={form.submit} className="grid gap-8">
      <div className="border-t border-border">
        <label className={ROW}>
          <span className={LABEL}>Business name</span>
          <input className={`${VALUE} text-[22px] font-semibold tracking-tight`} value={form.name} onChange={(e) => form.setName(e.target.value)} placeholder="Halden & Co." required />
        </label>
        <label className={ROW}>
          <span className={LABEL}>Email</span>
          <input className={VALUE} type="email" value={form.email} onChange={(e) => form.setEmail(e.target.value)} placeholder="hello@yourstudio.com" />
        </label>
        <label className={ROW}>
          <span className={LABEL}>Address</span>
          <textarea rows={2} className={`${VALUE} leading-relaxed`} value={form.address} onChange={(e) => form.setAddress(e.target.value)} placeholder={'Street\nCity and postcode'} />
        </label>
        <label className={ROW}>
          <span className={LABEL}>Payment details</span>
          <textarea rows={2} className={`${VALUE} font-mono text-[13.5px] leading-relaxed`} value={form.payment} onChange={(e) => form.setPayment(e.target.value)} placeholder={'Bank\nIBAN or sort code'} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-10 bg-gold px-5 text-[oklch(0.2_0.008_60)] hover:bg-gold/90">
          {HOME_COPY.setupSubmit}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-[12.5px] text-muted-foreground">{HOME_COPY.setupHint}</span>
      </div>
    </form>
  )
}
