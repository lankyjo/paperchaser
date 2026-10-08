import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { LANDING_COPY } from '../../strings/landing'
import { BrandMark } from '../brand/BrandMark'

const FLIGHT = 'M -80 620 C 300 560, 520 160, 860 280 S 1300 120, 1600 -60'

// Gold first screen: nav, the two-line headline, the lead and a dart flying along a dotted trail.
export function LandingHero() {
  return (
    <section className="lp-hero">
      <svg className="lp-flight" viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden="true"><path d={FLIGHT} /></svg>
      <div className="lp-dart" style={{ offsetPath: `path('${FLIGHT}')` }}><BrandMark className="size-16" /></div>
      <div className="lp-wrap">
        <nav>
          <span className="brand"><BrandMark className="size-7" />Paperchaser</span>
          <a className="link" href="#trail">{LANDING_COPY.nav.howItWorks}</a>
          <Link className="lp-btn small" to="/app">{LANDING_COPY.nav.open}</Link>
        </nav>
      </div>
      <div className="lp-wrap body">
        <h1>{LANDING_COPY.headline[0]}<span className="row2">{LANDING_COPY.headline[1]}</span></h1>
        <div className="meta">
          <p>{LANDING_COPY.lead}</p>
          <Link className="lp-btn" to="/app">{LANDING_COPY.start}<ArrowRight /></Link>
        </div>
      </div>
    </section>
  )
}
