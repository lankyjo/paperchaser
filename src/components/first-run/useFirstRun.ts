import { useState } from 'react'
import { companyRepo, projectsRepo } from '../../db/repos'
import type { Company } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { todayIso } from '../../lib/todayIso'
import { createSampleProject } from '../../project/sampleProject'

// First launch means no company profile and no projects yet; finishing it saves the profile and adds the sample project.
export function useFirstRun() {
  const [needed, setNeeded] = useState<boolean | null>(null)
  useMountEffect(() => {
    void Promise.all([companyRepo.get(), projectsRepo.list()]).then(([company, projects]) => setNeeded(company === undefined && projects.length === 0))
  })

  const finish = async (company: Company) => {
    await companyRepo.put(company)
    const sample = createSampleProject({ now: new Date().toISOString(), today: todayIso(), locale: navigator.language, company, newId: () => crypto.randomUUID() })
    await projectsRepo.putWithDocuments(sample)
    setNeeded(false)
  }

  return { needed, finish }
}
