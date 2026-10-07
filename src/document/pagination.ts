// A page item measured in px: its full height and, when it can split, the height of each unit (row, paragraph, step).
export interface MeasuredItem {
  id: string
  height: number
  units: number[]
  keepWithNext?: boolean
}

// One item on a page; range is the [from, to) slice of units when the item was split.
export interface PagePlacement {
  id: string
  range?: [number, number]
}

export interface Pagination {
  pages: PagePlacement[][]
  oversized: string[]
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

// Smallest piece of an item that must sit on a page: its first unit plus overhead, or all of it when atomic.
const minimumHeight = (item: MeasuredItem) => (item.units.length > 1 ? item.height - sum(item.units) + item.units[0] : item.height)

// Fills pages of the given content height in order; splittable items break between units, others move whole.
export function paginate(items: MeasuredItem[], space: number): Pagination {
  const pages: PagePlacement[][] = [[]]
  const oversized = new Set<string>()
  let used = 0
  const newPage = () => {
    if (used === 0) return
    pages.push([])
    used = 0
  }
  const place = (placement: PagePlacement, height: number) => {
    pages[pages.length - 1].push(placement)
    used += height
  }

  items.forEach((item, i) => {
    const next = items[i + 1]
    const needed = item.keepWithNext && next ? item.height + minimumHeight(next) : item.height
    if (used + needed <= space) return place({ id: item.id }, item.height)
    const splittable = item.units.length > 1 && (item.height > space || used + minimumHeight(item) <= space)
    if (!splittable) {
      newPage()
      if (item.height > space) oversized.add(item.id)
      return place({ id: item.id }, item.height)
    }
    const overhead = item.height - sum(item.units)
    let from = 0
    while (from < item.units.length) {
      let to = from
      let height = overhead
      while (to < item.units.length && used + height + item.units[to] <= space) height += item.units[to++]
      if (to === from) {
        if (used > 0) {
          newPage()
          continue
        }
        oversized.add(item.id)
        height += item.units[to++]
      }
      place({ id: item.id, range: [from, to] }, height)
      from = to
      if (from < item.units.length) newPage()
    }
  })
  return { pages, oversized: [...oversized] }
}
