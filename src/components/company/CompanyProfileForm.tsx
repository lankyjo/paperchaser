import type { Company } from '../../document/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { LogoPicker } from './LogoPicker'
import { useCompanyProfileForm } from './useCompanyProfileForm'

// Your business name, contact, address, tax ID, payment details and logos, printed as the sender on every document.
export function CompanyProfileForm({ initial, submitLabel, onSave }: { initial?: Company; submitLabel: string; onSave: (company: Company) => void }) {
  const form = useCompanyProfileForm(initial, onSave)
  return (
    <form onSubmit={form.submit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="company-name">Business name</Label>
        <Input id="company-name" value={form.name} onChange={(e) => form.setName(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-email">Email</Label>
        <Input id="company-email" type="email" value={form.email} onChange={(e) => form.setEmail(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-address">Address</Label>
        <Textarea id="company-address" rows={3} value={form.address} onChange={(e) => form.setAddress(e.target.value)} placeholder={'Street\nCity and postcode\nCountry'} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-tax-id">Tax ID (optional)</Label>
        <Input id="company-tax-id" value={form.taxId} onChange={(e) => form.setTaxId(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-payment">Payment details (optional)</Label>
        <Textarea id="company-payment" rows={3} value={form.payment} onChange={(e) => form.setPayment(e.target.value)} placeholder={'Bank name\nIBAN or account number\nSWIFT / BIC'} />
        <p className="text-xs text-muted-foreground">Printed on quotes, invoices, receipts and credit notes.</p>
      </div>
      <LogoPicker label="Logo" value={form.logo} onChange={form.setLogo} />
      <LogoPicker label="Logo for dark templates (optional)" value={form.logoOnDark} onChange={form.setLogoOnDark} />
      <Button type="submit" disabled={form.name.trim() === ''}>
        {submitLabel}
      </Button>
    </form>
  )
}
