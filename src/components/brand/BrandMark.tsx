import { cn } from '@/lib/utils'

// The Paperchaser mark: a sheet folded into a paper dart, ink with a gold wing; ink follows the text color.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn('size-6 shrink-0', className)}>
      <path d="M6 23 42 8 30 41l-8-12Z" fill="currentColor" />
      <path d="M22 29 42 8 30 41Z" className="fill-gold" />
      <path d="m22 29-2 10 6-6" fill="currentColor" opacity=".55" />
    </svg>
  )
}
