import { useState } from 'react'
import type { Client } from '../../project/client'
import { Button } from '../ui/button'
import { ClientForm } from './ClientForm'

interface ClientCardProps {
  client: Client
  usage: { projects: number; drafts: number; inUse: boolean }
  onSave: (next: Client) => void
  onDelete: () => void
}

// One client with its usage, edit form, archive toggle and delete (blocked while in use).
export function ClientCard({ client, usage, onSave, onDelete }: ClientCardProps) {
  const [editing, setEditing] = useState(false)
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">
          {client.name}
          {client.archived && <span className="ml-2 text-xs text-muted-foreground">Archived</span>}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'Close' : 'Edit'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSave({ ...client, archived: !client.archived })}>
            {client.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button size="sm" variant="destructive" disabled={usage.inUse} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
      {usage.inUse && (
        <p className="mt-1 text-xs text-muted-foreground">
          Used by {usage.drafts} drafts in {usage.projects} projects — archive instead of deleting.
        </p>
      )}
      {editing && (
        <div className="mt-3">
          <ClientForm client={client} onSave={(next) => { onSave(next); setEditing(false) }} />
        </div>
      )}
    </li>
  )
}
