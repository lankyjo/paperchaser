import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useOpenDocument } from '../../hooks/useOpenDocument'
import { filterProjects } from '../../project/searchProjects'
import { useHomeShortcuts } from './useHomeShortcuts'
import { useProjects } from './useProjects'

// The home command center: the query that filters projects and names new ones, the archive toggle, and the start actions.
export function useHomeCommand() {
  const home = useProjects()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const openDocument = useOpenDocument()
  const navigate = useNavigate()

  const entries = home.projects === null ? [] : filterProjects(home.projects.map((e) => ({ ...e.project, entry: e })), home.clientNames, query, showArchived).map((p) => p.entry)
  const lateProjectIds = new Set(home.overdue.map((o) => o.invoice.projectId))

  const create = async (title: string) => openDocument(await home.createWithInvoice(title))
  const focusSearch = () => inputRef.current?.focus()
  // With no name typed yet, New project asks for one first.
  const newProject = () => (query.trim() === '' ? focusSearch() : void create(query.trim()))
  const quickInvoice = () => void create('')
  // Enter opens the only matching project, otherwise creates one with the typed name.
  const submit = () => (entries.length === 1 && query.trim() !== '' ? void navigate({ to: '/projects/$projectId', params: { projectId: entries[0].project.id } }) : newProject())

  useHomeShortcuts({ focusSearch, quickInvoice })

  return { home, query, setQuery, showArchived, setShowArchived, inputRef, entries, lateProjectIds, newProject, quickInvoice, submit }
}
