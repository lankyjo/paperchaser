import { useState } from 'react'
import { countersRepo } from '../../db/repos'
import type { Counter } from '../../document/finalize'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

export const NUMBERED_TYPES: DocumentModel['type'][] = ['quote', 'agreement', 'invoice', 'receipt', 'creditNote']

// Stored number sequences per type, with the next number already in use remembered for the duplicate warning.
export function useNumbering() {
  const [counters, setCounters] = useState<Counter[] | null>(null)
  const [saved, setSaved] = useState<Counter[]>([])

  useMountEffect(() => {
    void Promise.all(NUMBERED_TYPES.map((t) => countersRepo.get(t))).then((loaded) => {
      setCounters(loaded)
      setSaved(loaded)
    })
  })

  const change = (next: Counter) => setCounters((current) => current?.map((c) => (c.type === next.type ? next : c)) ?? null)
  const save = async () => {
    if (!counters) return
    await Promise.all(counters.map((c) => countersRepo.put(c)))
    setSaved(counters)
  }
  const reusesNumbers = (counter: Counter) => counter.next < (saved.find((s) => s.type === counter.type)?.next ?? 1)

  return { counters, change, save, reusesNumbers }
}
