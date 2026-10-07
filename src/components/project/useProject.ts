import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { createClient, type Client } from '../../project/client'
import type { Project } from '../../project/project'

interface ProjectData {
  project: Project | null
  documents: DocumentModel[]
  clients: Client[]
}

async function loadProject(projectId: string): Promise<ProjectData> {
  const [project, documents, clients] = await Promise.all([
    projectsRepo.get(projectId),
    documentsRepo.byProject(projectId),
    clientsRepo.list(),
  ])
  return { project: project ?? null, documents, clients }
}

// One project with its documents and the client list, plus saving project details and creating a client inline.
export function useProject(projectId: string) {
  const [data, setData] = useState<ProjectData | null>(null)
  const reload = async () => setData(await loadProject(projectId))

  useMountEffect(() => {
    void reload()
  })

  const save = async (project: Project) => {
    await projectsRepo.put({ ...project, updatedAt: new Date().toISOString() })
    await reload()
  }

  const createClientFor = async (project: Project, name: string) => {
    const client = createClient({ id: crypto.randomUUID(), name })
    await clientsRepo.put(client)
    await save({ ...project, clientId: client.id })
  }

  return { data, save, createClientFor }
}
