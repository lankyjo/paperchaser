import { LANDING_COPY, type LandingStep } from '../../strings/landing'

// What a document holds, what the app does for it, and a tip.
export function StepDetail({ step }: { step: LandingStep }) {
  return (
    <div className="lp-more">
      <div><h4>{LANDING_COPY.what}</h4><ul>{step.what.map((w) => <li key={w}>{w}</li>)}</ul></div>
      <div className="does"><h4>{LANDING_COPY.does}</h4><ul>{step.does.map((w) => <li key={w}>{w}</li>)}</ul></div>
      <p className="tip"><b>{LANDING_COPY.tip}</b> {step.tip}</p>
    </div>
  )
}
