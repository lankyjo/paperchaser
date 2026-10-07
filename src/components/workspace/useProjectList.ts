import { useState } from 'react'
import { projectsRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'
import type { Project } from '../../project/project'

// Every stored project, newest first; empty until loaded.
export function useProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  useMountEffect(() => {
    void projectsRepo.list().then(setProjects)
  })
  return projects
}
