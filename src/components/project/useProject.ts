import { useState } from 'react'
import { assetsRepo, clientsRepo, documentsRepo, projectsRepo } from '../../db/repos'
import { newDocument } from '../../document/newDocument'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { createClient, type Client } from '../../project/client'
import { useProjectHistory } from './useProjectHistory'
import type { StepType } from '../../project/pipeline'
import type { Project } from '../../project/project'
import { todayIso } from '../../lib/todayIso'

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

  const write = async (project: Project) => {
    await projectsRepo.put({ ...project, updatedAt: new Date().toISOString() })
    await reload()
  }
  const history = useProjectHistory(write)
  // Every project edit is undoable from the project page; the current project is the undo point.
  const save = (project: Project) => (data?.project ? history.save(data.project, project) : write(project))

  const createClientFor = async (project: Project, name: string) => {
    const client = createClient({ id: crypto.randomUUID(), name })
    await clientsRepo.put(client)
    await save({ ...project, clientId: client.id })
  }

  const createDocument = async (type: StepType): Promise<DocumentModel> => {
    const doc = newDocument({
      type,
      id: crypto.randomUUID(),
      projectId,
      today: todayIso(),
      newId: () => crypto.randomUUID(),
    })
    await documentsRepo.put(doc)
    return doc
  }

  const toggleDone = async (project: Project, type: StepType) => {
    const done = project.doneSteps ?? []
    await save({ ...project, doneSteps: done.includes(type) ? done.filter((t) => t !== type) : [...done, type] })
  }

  // Images only the deleted documents used are removed with them.
  const remove = () => projectsRepo.delete(projectId).then(() => assetsRepo.pruneUnreferenced())

  const undo = () => data?.project && history.undo(data.project)
  const redo = () => data?.project && history.redo(data.project)

  return { data, save, createClientFor, createDocument, toggleDone, remove, undo, redo, canUndo: history.canUndo, canRedo: history.canRedo, historySteps: history.steps }
}
