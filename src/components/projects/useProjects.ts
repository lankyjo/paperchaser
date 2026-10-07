import { useState } from 'react'
import { assetsRepo, clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { newInvoice } from '../../document/newInvoice'
import { overdueInvoices, type OverdueInvoice } from '../../document/overdue'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { createProject, type Project } from '../../project/project'

export interface ProjectWithDocuments {
  project: Project
  documents: DocumentModel[]
}

async function loadProjects(): Promise<ProjectWithDocuments[]> {
  const projects = await projectsRepo.list()
  return Promise.all(projects.map(async (project) => ({ project, documents: await documentsRepo.byProject(project.id) })))
}

// Stored projects with their documents, plus creating a project that starts with one invoice.
export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithDocuments[] | null>(null)
  const [clientNames, setClientNames] = useState(new Map<string, string>())
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])
  const reload = async () => {
    setProjects(await loadProjects())
    setOverdue(overdueInvoices(await documentsRepo.list(), new Date().toLocaleDateString('en-CA')))
    setClientNames(new Map((await clientsRepo.list()).map((c) => [c.id, c.name])))
  }

  useMountEffect(() => {
    void reload()
    void assetsRepo.pruneUnreferenced()
  })

  const createWithInvoice = async (title: string): Promise<DocumentModel> => {
    const now = new Date()
    const project = { ...createProject({ id: crypto.randomUUID(), title, now: now.toISOString() }), currency: 'EUR', locale: navigator.language }
    const invoice = { ...newInvoice({ id: crypto.randomUUID(), projectId: project.id, today: now.toLocaleDateString('en-CA') }), locale: project.locale }
    await projectsRepo.put(project)
    await documentsRepo.put(invoice)
    return invoice
  }

  return { projects, clientNames, overdue, createWithInvoice }
}
