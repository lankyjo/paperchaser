import { useState, type FormEvent } from 'react'
import { parseToMinor } from '../../document/money'
import type { Payment } from '../../document/payments'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

// Records money received (or a refund, entered as a negative amount).
export function AddPaymentForm({ currency, locale, onAdd }: { currency: string; locale?: string; onAdd: (payment: Payment) => void }) {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Bank transfer')
  const isRefund = amount.trim().startsWith('-')
  const minor = parseToMinor(amount.replace('-', ''), currency, locale)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (minor === null || minor === 0) return
    onAdd({ id: crypto.randomUUID(), date, amountMinor: isRefund ? -minor : minor, method })
    setAmount('')
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <Input aria-label="Payment date" type="date" className="w-36" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input aria-label="Amount received" placeholder="Amount (negative for a refund)" className="w-48" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input aria-label="Payment method" className="w-36" value={method} onChange={(e) => setMethod(e.target.value)} />
      <Button size="sm" type="submit" disabled={minor === null || minor === 0}>
        Record payment
      </Button>
    </form>
  )
}
