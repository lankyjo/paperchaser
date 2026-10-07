import type { MeasuredItem } from '../../document/pagination'

const top = (el: Element) => el.getBoundingClientRect().top

// Reads each page item's height (up to the next item) and its unit heights from a rendered DocumentPage.
export function measurePageItems(root: HTMLElement): MeasuredItem[] {
  const items = [...root.querySelectorAll<HTMLElement>('[data-page-item]')]
  const end = root.querySelector('[data-page-end]')
  return items.map((el, i) => {
    const units = el.dataset.splittable ? [...el.querySelectorAll('[data-unit]')] : []
    return {
      id: el.dataset.pageItem ?? '',
      height: top(items[i + 1] ?? end ?? el) - top(el),
      units: units.map((u, j) => (j + 1 < units.length ? top(units[j + 1]) : u.getBoundingClientRect().bottom) - top(u)),
      keepWithNext: el.dataset.keepWithNext !== undefined,
    }
  })
}
