import { useState, type FormEvent } from 'react'
import { minorToRaw, parseToMinor } from '../../document/money'
import type { Project } from '../../project/project'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

// Title, fee, dates and deliverables shared by every document in the project.
export function ProjectDetailsForm({ project, onSave }: { project: Project; onSave: (next: Project) => void }) {
  const [title, setTitle] = useState(project.title)
  const [fee, setFee] = useState(project.feeMinor === undefined ? '' : minorToRaw(project.feeMinor, 'EUR'))
  const [startDate, setStartDate] = useState(project.startDate ?? '')
  const [dueDate, setDueDate] = useState(project.dueDate ?? '')
  const [deliverables, setDeliverables] = useState((project.deliverables ?? []).join('\n'))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({
      ...project,
      title: title.trim(),
      feeMinor: parseToMinor(fee, 'EUR') ?? undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      deliverables: deliverables.split('\n').map((l) => l.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="project-title">Title</Label>
        <Input id="project-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-fee">Project fee</Label>
        <Input id="project-fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-start">Start date</Label>
        <Input id="project-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="project-due">Due date</Label>
        <Input id="project-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="project-deliverables">Deliverables (one per line)</Label>
        <textarea
          id="project-deliverables"
          className="min-h-20 rounded-md border bg-transparent px-3 py-2 text-sm"
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
        />
      </div>
      <Button type="submit" className="sm:col-span-2">
        Save project
      </Button>
    </form>
  )
}
