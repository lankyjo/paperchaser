import { useState, type FormEvent } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

// Title field and submit button; disabled until the title has text.
export function NewProjectForm({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (title.trim() !== '') onCreate(title)
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input aria-label="Project title" placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Button type="submit" disabled={title.trim() === ''}>
        New project
      </Button>
    </form>
  )
}
