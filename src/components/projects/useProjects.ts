import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { newInvoice } from '../../document/newInvoice'
import { overdueInvoices, type OverdueInvoice } from '../../document/overdue'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { createProject, type Project } from '../../project/project'
import { realDocuments } from '../../project/sampleProject'
import { todayIso } from '../../lib/todayIso'

export interface ProjectWithDocuments {
  project: Project
  documents: DocumentModel[]
}

// Every project with its documents, from one read of each table.
async function loadHome() {
  const [projects, documents, clients] = await Promise.all([projectsRepo.list(), documentsRepo.list(), clientsRepo.list()])
  const byProject = new Map<string, DocumentModel[]>()
  for (const d of documents) {
    if (!byProject.has(d.projectId)) byProject.set(d.projectId, [])
    byProject.get(d.projectId)!.push(d)
  }
  return {
    projects: projects.map((project) => ({ project, documents: byProject.get(project.id) ?? [] })),
    // The sample project never shows up as overdue.
    overdue: overdueInvoices(realDocuments(projects, documents), todayIso()),
    clientNames: new Map(clients.map((c) => [c.id, c.name])),
  }
}

// Stored projects with their documents, plus creating a project that starts with one invoice.
export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithDocuments[] | null>(null)
  const [clientNames, setClientNames] = useState(new Map<string, string>())
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])
  const reload = () =>
    loadHome().then((home) => {
      setProjects(home.projects)
      setOverdue(home.overdue)
      setClientNames(home.clientNames)
    })
  useMountEffect(() => {
    void reload()
  })

  const createWithInvoice = async (title: string): Promise<DocumentModel> => {
    const now = new Date()
    const project = { ...createProject({ id: crypto.randomUUID(), title, now: now.toISOString() }), currency: 'EUR', locale: navigator.language }
    const invoice = { ...newInvoice({ id: crypto.randomUUID(), projectId: project.id, today: todayIso() }), locale: project.locale }
    await projectsRepo.put(project)
    await documentsRepo.put(invoice)
    return invoice
  }

  return { projects, clientNames, overdue, createWithInvoice, reload }
}
