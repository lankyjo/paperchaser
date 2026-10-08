import { PIPELINE_STEPS } from '../../project/pipeline'
import type { Company } from '../../document/types'
import { HOME_COPY } from '../../strings/home'
import { CompanyProfileForm } from '../company/CompanyProfileForm'
import { Button } from '../ui/button'

// First launch: a dark welcome with the ten-step pipeline beside the business setup form.
export function WelcomeScreen({ onFinish, onSkip }: { onFinish: (company: Company) => void; onSkip: () => void }) {
  return (
    <main className="ink -my-6 grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between gap-10 px-5 py-8 lg:px-16 lg:py-14">
        <div className="flex items-center gap-2.5 font-semibold">
          <span aria-hidden="true" className="size-5.5 rounded-md bg-gold" />
          Paperchaser
        </div>
        <h1 className="max-w-[13ch] text-4xl leading-[1.02] font-semibold tracking-tight lg:text-6xl">
          {HOME_COPY.welcomeTitleStart} <em className="text-gold not-italic">{HOME_COPY.welcomeTitleAccent}</em>
          {HOME_COPY.welcomeTitleEnd}
        </h1>
        <div>
          <p className="max-w-[44ch] text-[15px] text-muted-foreground">{HOME_COPY.welcomeLead}</p>
          <ol aria-label="The ten steps" className="mt-6 grid max-w-lg grid-cols-10 gap-1.5 font-mono text-[10.5px] text-muted-foreground">
            {PIPELINE_STEPS.map((step, i) => (
              <li key={step.type} className={`border-t-2 pt-2 ${i < 2 ? 'border-gold text-foreground' : 'border-border'}`}>
                {String(i + 1).padStart(2, '0')}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section aria-label="Set up your business" className="grid content-center bg-card px-5 py-8 lg:px-16 lg:py-14">
        <div className="max-w-md">
          <h2 className="text-lg font-semibold">{HOME_COPY.setupTitle}</h2>
          <p className="mb-6 mt-1 text-muted-foreground">{HOME_COPY.setupLead}</p>
          <CompanyProfileForm submitLabel={HOME_COPY.setupSubmit} onSave={onFinish} />
          <p className="mt-3 text-sm text-muted-foreground">{HOME_COPY.setupHint}</p>
          <Button variant="ghost" size="sm" className="mt-4 -ml-2" onClick={onSkip}>
            {HOME_COPY.skip}
          </Button>
        </div>
      </section>
    </main>
  )
}
