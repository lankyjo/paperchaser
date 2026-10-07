import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { newInvoice } from '../../document/newInvoice'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { createClient, type Client } from '../../project/client'
import { createProject, type Project } from '../../project/project'

export interface ProjectWithDocuments {
  project: Project
  documents: DocumentModel[]
}

async function loadProjects(): Promise<ProjectWithDocuments[]> {
  const projects = await projectsRepo.list()
  return Promise.all(projects.map(async (project) => ({ project, documents: await documentsRepo.byProject(project.id) })))
}

// Stored projects with their documents and clients, plus creating projects and assigning clients.
export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithDocuments[] | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const reload = async () => {
    const [nextProjects, nextClients] = await Promise.all([loadProjects(), clientsRepo.list()])
    setProjects(nextProjects)
    setClients(nextClients)
  }

  useMountEffect(() => {
    void reload()
  })

  const assignClient = async (project: Project, clientId: string | undefined) => {
    await projectsRepo.put({ ...project, clientId, updatedAt: new Date().toISOString() })
    await reload()
  }

  const createClientFor = async (project: Project, name: string) => {
    const client = createClient({ id: crypto.randomUUID(), name })
    await clientsRepo.put(client)
    await assignClient(project, client.id)
  }

  const createWithInvoice = async (title: string): Promise<DocumentModel> => {
    const now = new Date()
    const project = createProject({ id: crypto.randomUUID(), title, now: now.toISOString() })
    const invoice = newInvoice({ id: crypto.randomUUID(), projectId: project.id, today: now.toLocaleDateString('en-CA') })
    await projectsRepo.put(project)
    await documentsRepo.put(invoice)
    return invoice
  }

  return { projects, clients, createWithInvoice, assignClient, createClientFor }
}
