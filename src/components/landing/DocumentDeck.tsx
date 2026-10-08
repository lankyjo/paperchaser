import type { CSSProperties } from 'react'
import { LANDING_STEPS } from '../../strings/landing'
import { SAMPLE_SHEETS } from '../../strings/landingSamples'
import { SampleSheet } from './SampleSheet'
import { StepCounter } from './StepCounter'
import { useDeckProgress } from './useDeckProgress'
import { useSheetFit } from './useSheetFit'

// Phones: the screen pins while scrolling deals each sheet in from the right onto the pile.
export function DocumentDeck() {
  const { index, deckRef } = useDeckProgress(SAMPLE_SHEETS.length)
  const fitRef = useSheetFit(1)
  const step = LANDING_STEPS[index]
  return (
    <section className="lp-deck" ref={deckRef} aria-label="The ten documents, one per scroll">
      <div className="pin">
        <header>
          <StepCounter index={index} total={LANDING_STEPS.length} />
          <h2>{step.title}</h2>
          <p>{step.purpose}</p>
        </header>
        <div className="pile" ref={fitRef}>
          {SAMPLE_SHEETS.map((sheet, i) => (
            <div key={sheet.title} className="card" style={{ '--i': i, zIndex: i } as CSSProperties}>
              <SampleSheet sheet={sheet} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
