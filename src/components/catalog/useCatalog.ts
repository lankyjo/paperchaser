import { useState } from 'react'
import { catalogRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'
import type { CatalogItem } from '../../project/catalog'

// Saved services with add, update and delete.
export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const reload = async () => setItems(await catalogRepo.list())
  useMountEffect(() => {
    void reload()
  })
  const save = async (item: CatalogItem) => {
    await catalogRepo.put(item)
    await reload()
  }
  const remove = async (id: string) => {
    await catalogRepo.delete(id)
    await reload()
  }
  return { items, save, remove }
}
