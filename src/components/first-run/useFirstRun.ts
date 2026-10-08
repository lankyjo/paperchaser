import { useState } from 'react'
import { companyRepo, projectsRepo } from '../../db/repos'
import type { Company } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import { todayIso } from '../../lib/todayIso'
import { createSampleProject } from '../../project/sampleProject'

// Remembered in this browser only: someone chose to look around before setting up.
const SKIPPED_KEY = 'paperchaser.welcomeSkipped'

const wasSkipped = () => {
  try {
    return localStorage.getItem(SKIPPED_KEY) === '1'
  } catch {
    return false
  }
}

// First launch means no company profile and no projects yet; finishing it saves the profile and adds the sample project.
export function useFirstRun() {
  const [needed, setNeeded] = useState<boolean | null>(null)
  useMountEffect(() => {
    void Promise.all([companyRepo.get(), projectsRepo.list()]).then(([company, projects]) => setNeeded(company === undefined && projects.length === 0 && !wasSkipped()))
  })

  const finish = async (company: Company) => {
    await companyRepo.put(company)
    const sample = createSampleProject({ now: new Date().toISOString(), today: todayIso(), locale: navigator.language, company, newId: () => crypto.randomUUID() })
    await projectsRepo.putWithDocuments(sample)
    setNeeded(false)
  }

  const skip = () => {
    try {
      localStorage.setItem(SKIPPED_KEY, '1')
    } catch {
      // Private windows can refuse storage; skipping still works for this visit.
    }
    setNeeded(false)
  }

  return { needed, finish, skip }
}
