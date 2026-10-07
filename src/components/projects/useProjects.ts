import { useState } from 'react'
import { documentsRepo, projectsRepo } from '../../db/repos'
import { newInvoice } from '../../document/newInvoice'
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

// Stored projects with their documents, plus creating a titled project that starts with one invoice.
export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithDocuments[] | null>(null)

  useMountEffect(() => {
    void loadProjects().then(setProjects)
  })

  const createWithInvoice = async (title: string): Promise<DocumentModel> => {
    const now = new Date()
    const project = createProject({ id: crypto.randomUUID(), title, now: now.toISOString() })
    const invoice = newInvoice({ id: crypto.randomUUID(), projectId: project.id, today: now.toLocaleDateString('en-CA') })
    await projectsRepo.put(project)
    await documentsRepo.put(invoice)
    return invoice
  }

  return { projects, createWithInvoice }
}
