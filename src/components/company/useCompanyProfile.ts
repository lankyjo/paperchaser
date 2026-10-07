import { useState } from 'react'
import { companyRepo } from '../../db/repos'
import type { Company } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

// The stored company profile (undefined while loading, null when none) and saving a new one.
export function useCompanyProfile() {
  const [company, setCompany] = useState<Company | null | undefined>(undefined)
  useMountEffect(() => {
    void companyRepo.get().then((stored) => setCompany(stored ?? null))
  })
  const save = async (next: Company) => {
    await companyRepo.put(next)
    setCompany(next)
  }
  return { company, save }
}
