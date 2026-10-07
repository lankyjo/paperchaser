import { useState } from 'react'
import type { Client } from '../../project/client'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ClientPickerProps {
  projectTitle: string
  clientId: string | undefined
  clients: Client[]
  onPick: (clientId: string | undefined) => void
  onCreate: (name: string) => void
}

// Chooses the project's client from active clients, or creates a new one inline.
export function ClientPicker({ projectTitle, clientId, clients, onPick, onCreate }: ClientPickerProps) {
  const [newName, setNewName] = useState('')
  const options = clients.filter((c) => !c.archived || c.id === clientId)
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <select
        aria-label={`Client for ${projectTitle}`}
        className="h-8 rounded-md border bg-transparent px-2"
        value={clientId ?? ''}
        onChange={(e) => onPick(e.target.value === '' ? undefined : e.target.value)}
      >
        <option value="">No client</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Input
        aria-label={`New client for ${projectTitle}`}
        placeholder="New client"
        className="h-8 w-40"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={newName.trim() === ''}
        onClick={() => {
          onCreate(newName)
          setNewName('')
        }}
      >
        Add
      </Button>
    </div>
  )
}
