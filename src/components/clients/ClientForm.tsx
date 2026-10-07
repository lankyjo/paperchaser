import { useState, type FormEvent } from 'react'
import type { Client } from '../../project/client'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const TEXT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'contactPerson', label: 'Contact person' },
  { key: 'email', label: 'Email' },
  { key: 'taxId', label: 'Tax / registration ID' },
] as const

// Edits one client's details; the billing address is one line per row.
export function ClientForm({ client, onSave }: { client: Client; onSave: (next: Client) => void }) {
  const [draft, setDraft] = useState(client)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({ ...draft, name: draft.name.trim(), billingAddress: draft.billingAddress.filter((l) => l.trim() !== '') })
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      {TEXT_FIELDS.map(({ key, label }) => (
        <div key={key} className="grid gap-1">
          <Label htmlFor={`${client.id}-${key}`}>{label}</Label>
          <Input id={`${client.id}-${key}`} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
        </div>
      ))}
      <div className="grid gap-1">
        <Label htmlFor={`${client.id}-address`}>Billing address</Label>
        <textarea
          id={`${client.id}-address`}
          className="min-h-20 rounded-md border bg-transparent px-3 py-2 text-sm"
          value={draft.billingAddress.join('\n')}
          onChange={(e) => setDraft({ ...draft, billingAddress: e.target.value.split('\n') })}
        />
      </div>
      <Button type="submit" disabled={draft.name.trim() === ''}>
        Save client
      </Button>
    </form>
  )
}
