import { Link } from '@tanstack/react-router'
import { minorToRaw } from '../../document/money'
import { Button } from '../ui/button'
import { ServiceForm } from './ServiceForm'
import { useCatalog } from './useCatalog'

const blank = () => ({ id: crypto.randomUUID(), name: '', description: '', priceMinor: 0, taxRateMinor: 0 })

// Saved services you offer often, ready to insert into quotes and invoices.
export function CatalogPage() {
  const { items, save, remove } = useCatalog()
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4">
      <Link to="/" className="text-sm underline">
        Projects
      </Link>
      <h1 className="text-xl font-semibold">Services</h1>
      <section aria-label="New service" className="rounded-lg border bg-card p-4">
        <ServiceForm key={items.length} item={blank()} onSave={(item) => void save(item)} />
      </section>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} aria-label={item.name} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span>{minorToRaw(item.priceMinor, 'EUR', navigator.language)}</span>
            </div>
            <ServiceForm item={item} onSave={(next) => void save(next)} />
            <Button size="xs" variant="ghost" className="self-start" onClick={() => void remove(item.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </main>
  )
}
