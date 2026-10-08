import '../../styles/landing.css'
import { DocumentDeck } from './DocumentDeck'
import { DocumentTrail } from './DocumentTrail'
import { LandingClosing } from './LandingClosing'
import { LandingHero } from './LandingHero'
import { StepsMarquee } from './StepsMarquee'

// The public page at "/": what Paperchaser is, the ten documents it makes, and the way in.
export function LandingPage() {
  return (
    <main className="landing">
      <LandingHero />
      <StepsMarquee />
      <DocumentTrail />
      <DocumentDeck />
      <LandingClosing />
    </main>
  )
}
