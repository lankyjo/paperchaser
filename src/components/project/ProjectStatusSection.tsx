import { useState } from 'react'
import type { Project } from '../../project/project'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const STATES: { value: Project['state']; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'lost', label: 'Lost' },
]

interface ProjectStatusSectionProps {
  project: Project
  canDelete: boolean
  onSave: (next: Project) => void
  onDelete: () => void
}

// Project state, the prospect for a lead, archiving, and deleting a project nothing has been billed from.
export function ProjectStatusSection({ project, canDelete, onSave, onDelete }: ProjectStatusSectionProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [prospect, setProspect] = useState(project.prospectName ?? '')
  return (
    <section className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-1">
        <Label htmlFor="project-state">Status</Label>
        <select
          id="project-state"
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          value={project.state}
          disabled={project.archived}
          onChange={(e) => onSave({ ...project, state: e.target.value as Project['state'] })}
        >
          {STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {project.state === 'lead' && project.clientId === undefined && (
        <div className="grid gap-1">
          <Label htmlFor="project-prospect">Prospect</Label>
          <Input id="project-prospect" value={prospect} disabled={project.archived} onChange={(e) => setProspect(e.target.value)} onBlur={() => onSave({ ...project, prospectName: prospect.trim() || undefined })} />
        </div>
      )}
      <Button size="sm" variant="outline" onClick={() => onSave({ ...project, archived: !project.archived })}>
        {project.archived ? 'Unarchive' : 'Archive'}
      </Button>
      {canDelete && !project.archived && (
        <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
          Delete project
        </Button>
      )}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>The project and all its draft documents are removed for good.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
