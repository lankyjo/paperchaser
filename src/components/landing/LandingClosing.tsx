import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { LANDING_COPY } from '../../strings/landing'
import { BrandMark } from '../brand/BrandMark'

// The closing call to open the app, and the footer.
export function LandingClosing() {
  return (
    <div className="lp-wrap">
      <section className="lp-end">
        <h2>{LANDING_COPY.closing[0]}<br />{LANDING_COPY.closing[1]}</h2>
        <div><Link className="lp-btn" to="/app">{LANDING_COPY.closingCta}<ArrowRight /></Link></div>
      </section>
      <footer className="lp-foot">
        <span><BrandMark className="size-[18px]" />Paperchaser</span>
        <span>{LANDING_COPY.footer}</span>
      </footer>
    </div>
  )
}
