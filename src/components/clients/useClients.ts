import { useState } from 'react'
import { clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'
import { clientUsage, createClient, type Client } from '../../project/client'
import type { Project } from '../../project/project'

interface ClientsData {
  clients: Client[]
  projects: Project[]
  documents: { projectId: string; status: string }[]
}

async function loadClientsData(): Promise<ClientsData> {
  const [clients, projects, documents] = await Promise.all([clientsRepo.list(), projectsRepo.list(), documentsRepo.list()])
  return { clients, projects, documents }
}

// Client list with usage counts and the create, update, archive and delete actions.
export function useClients() {
  const [data, setData] = useState<ClientsData | null>(null)
  const reload = async () => setData(await loadClientsData())

  useMountEffect(() => {
    void reload()
  })

  const usageOf = (clientId: string) => clientUsage(clientId, data?.projects ?? [], data?.documents ?? [])

  const create = async (name: string): Promise<Client> => {
    const client = createClient({ id: crypto.randomUUID(), name })
    await clientsRepo.put(client)
    await reload()
    return client
  }

  const update = async (client: Client) => {
    await clientsRepo.put(client)
    await reload()
  }

  const remove = async (clientId: string) => {
    if (usageOf(clientId).inUse) return
    await clientsRepo.delete(clientId)
    await reload()
  }

  return { clients: data?.clients ?? null, usageOf, create, update, remove }
}
