import { useState } from 'react'
import { companyRepo, projectsRepo } from '../../db/repos'
import type { Company } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { todayIso } from '../../lib/todayIso'
import { createSampleProject } from '../../project/sampleProject'

// End-to-end tests set this flag so a fresh browser starts on the home screen.
const BYPASS_KEY = 'paperchaser.welcomeSkipped'

const isBypassed = () => {
  try {
    return localStorage.getItem(BYPASS_KEY) === '1'
  } catch {
    return false
  }
}

// First launch means no company profile and no projects yet; finishing it saves the profile and adds the sample project.
export function useFirstRun() {
  const [needed, setNeeded] = useState<boolean | null>(null)
  useMountEffect(() => {
    void Promise.all([companyRepo.get(), projectsRepo.list()]).then(([company, projects]) => setNeeded(company === undefined && projects.length === 0 && !isBypassed()))
  })

  const finish = async (company: Company) => {
    await companyRepo.put(company)
    const sample = createSampleProject({ now: new Date().toISOString(), today: todayIso(), locale: navigator.language, company, newId: () => crypto.randomUUID() })
    await projectsRepo.putWithDocuments(sample)
    setNeeded(false)
  }

  // A restored backup or imported project already holds the business details.
  const restored = () => setNeeded(false)

  return { needed, finish, restored }
}
