import { LANDING_STEPS } from '../../strings/landing'
import { SAMPLE_SHEETS } from '../../strings/landingSamples'
import { SampleSheet } from './SampleSheet'
import { StepCounter } from './StepCounter'
import { StepDetail } from './StepDetail'
import { useActiveStep } from './useActiveStep'
import { useSheetFit } from './useSheetFit'

// Wide screens: the steps scroll on the left while the matching sheet stays pinned on the right.
export function DocumentTrail() {
  const { active, stepsRef } = useActiveStep()
  const fitRef = useSheetFit(0.84)
  return (
    <section className="lp-trail" id="trail">
      <div className="lp-wrap grid">
        <div className="steps" ref={stepsRef}>
          {LANDING_STEPS.map((step, i) => (
            <article key={step.title} data-step={i} className={i === active ? 'step on' : 'step'}>
              <b>{String(i + 1).padStart(2, '0')} / {LANDING_STEPS.length}</b>
              <h2>{step.title}</h2>
              <p>{step.purpose}</p>
              <StepDetail step={step} />
            </article>
          ))}
        </div>
        <div className="stage" ref={fitRef} aria-label="The document for this step">
          {SAMPLE_SHEETS.map((sheet, i) => <SampleSheet key={sheet.title} sheet={sheet} className={i === active ? 'on' : ''} />)}
          <StepCounter index={active} total={LANDING_STEPS.length} />
        </div>
      </div>
    </section>
  )
}
