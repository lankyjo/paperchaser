import { useState, type FormEvent } from 'react'
import { getPlainText } from '../../document/richtext'
import type { Company } from '../../document/types'

const EMPTY: Company = { name: '', address: [], email: '', logo: null }

const lines = (text: string) => text.split('\n').map((line) => line.trim()).filter((line) => line !== '')

// Form state for the company profile, starting from the saved profile; submit hands back a clean Company.
export function useCompanyProfileForm(initial: Company = EMPTY, onSave: (company: Company) => void) {
  const [name, setName] = useState(getPlainText(initial.name))
  const [email, setEmail] = useState(getPlainText(initial.email))
  const [address, setAddress] = useState(initial.address.map(getPlainText).join('\n'))
  const [taxId, setTaxId] = useState(initial.taxId ?? '')
  const [payment, setPayment] = useState((initial.payment ?? []).join('\n'))
  const [logo, setLogo] = useState(initial.logo)
  const [logoOnDark, setLogoOnDark] = useState(initial.logoOnDark ?? null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({
      name: name.trim(),
      email: email.trim(),
      address: lines(address),
      logo,
      ...(taxId.trim() !== '' && { taxId: taxId.trim() }),
      ...(lines(payment).length > 0 && { payment: lines(payment) }),
      ...(logoOnDark !== null && { logoOnDark }),
    })
  }

  return { name, setName, email, setEmail, address, setAddress, taxId, setTaxId, payment, setPayment, logo, setLogo, logoOnDark, setLogoOnDark, submit }
}
