import { useState, type FormEvent } from 'react'
import { getPlainText } from '../../document/richtext'
import type { Company } from '../../document/types'
import { LocalImage } from '../document-page/LocalImage'
import { useLogoUpload } from '../branding/useLogoUpload'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

const EMPTY: Company = { name: '', address: [], email: '', logo: null }

// Your business name, contact, address, tax ID and logo, printed as the sender on every document.
export function CompanyProfileForm({ initial = EMPTY, submitLabel, onSave }: { initial?: Company; submitLabel: string; onSave: (company: Company) => void }) {
  const [name, setName] = useState(getPlainText(initial.name))
  const [email, setEmail] = useState(getPlainText(initial.email))
  const [address, setAddress] = useState(initial.address.map(getPlainText).join('\n'))
  const [taxId, setTaxId] = useState(initial.taxId ?? '')
  const [logo, setLogo] = useState(initial.logo)
  const { logoError, inputRef, readLogoFile } = useLogoUpload(setLogo)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const lines = address.split('\n').map((line) => line.trim()).filter((line) => line !== '')
    onSave({ name: name.trim(), email: email.trim(), address: lines, logo, ...(taxId.trim() !== '' && { taxId: taxId.trim() }) })
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="company-name">Business name</Label>
        <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-email">Email</Label>
        <Input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-address">Address</Label>
        <Textarea id="company-address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={'Street\nCity and postcode\nCountry'} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company-tax-id">Tax ID (optional)</Label>
        <Input id="company-tax-id" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        {logo !== null && <LocalImage src={logo} alt="Your logo" className="size-12 rounded object-contain ring-1 ring-foreground/10" />}
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {logo === null ? 'Add logo' : 'Change logo'}
        </Button>
        {logo !== null && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setLogo(null)}>
            Remove logo
          </Button>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" aria-label="Logo file" className="hidden" onChange={(e) => {
            readLogoFile(e.target.files?.[0])
            // Lets the same file be picked again after removing it.
            e.target.value = ''
          }} />
      </div>
      {logoError && <p className="text-xs text-destructive">Couldn't load that file. Use a PNG, JPG or SVG up to 2 MB.</p>}
      <Button type="submit" disabled={name.trim() === ''}>
        {submitLabel}
      </Button>
    </form>
  )
}
