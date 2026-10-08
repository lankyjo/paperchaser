import { LANDING_STEPS } from '../../strings/landing'
import { BrandMark } from '../brand/BrandMark'

// An ink band of the ten document names that loops; rendered twice so the loop joins seamlessly.
export function StepsMarquee() {
  const run = (hidden: boolean) =>
    LANDING_STEPS.map((s, i) => (
      <span key={`${hidden}-${s.title}`} className="item" aria-hidden={hidden || undefined}>
        <span className={i % 2 ? 'name hollow' : 'name'}><sup>{String(i + 1).padStart(2, '0')}</sup>{s.title}</span>
        <BrandMark className="size-5" />
      </span>
    ))
  return (
    <div className="lp-band" aria-label="The ten documents">
      <div className="track">{run(false)}{run(true)}</div>
    </div>
  )
}
