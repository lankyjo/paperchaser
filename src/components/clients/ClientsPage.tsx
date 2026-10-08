import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ClientCard } from './ClientCard'
import { useClients } from './useClients'

// Client list: add by name, edit details, archive or delete unused clients.
export function ClientsPage() {
  const { clients, usageOf, create, update, remove } = useClients()
  const [name, setName] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const visible = clients?.filter((c) => showArchived || !c.archived) ?? []

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Link to="/app" className="text-sm underline">
          Projects
        </Link>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim() === '') return
          void create(name).then(() => setName(''))
        }}
      >
        <Input aria-label="Client name" placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={name.trim() === ''}>
          Add client
        </Button>
      </form>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
        Show archived
      </label>
      <ul className="flex flex-col gap-3">
        {visible.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            usage={usageOf(client.id)}
            onSave={(next) => void update(next)}
            onDelete={() => void remove(client.id)}
          />
        ))}
      </ul>
    </main>
  )
}
