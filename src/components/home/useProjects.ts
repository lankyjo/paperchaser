import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { newInvoice } from '../../document/newInvoice'
import { overdueInvoices } from '../../document/overdue'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { createProject, type Project } from '../../project/project'
import { receiptsToSend } from '../../project/homeTasks'
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
  // The sample project never shows up as overdue or as owing a receipt.
  const real = realDocuments(projects, documents)
  return {
    projects: projects.map((project) => ({ project, documents: byProject.get(project.id) ?? [] })),
    overdue: overdueInvoices(real, todayIso()),
    receipts: receiptsToSend(real),
    clientNames: new Map(clients.map((c) => [c.id, c.name])),
  }
}

// Stored projects with their documents, what needs attention, and creating a project that starts with one invoice.
export function useProjects() {
  const [home, setHome] = useState<Awaited<ReturnType<typeof loadHome>> | null>(null)
  const reload = () => loadHome().then(setHome)
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

  return {
    projects: home?.projects ?? null,
    clientNames: home?.clientNames ?? new Map<string, string>(),
    overdue: home?.overdue ?? [],
    receipts: home?.receipts ?? [],
    createWithInvoice,
    reload,
  }
}
