import { memo } from 'react'
import { FIXTURE_MAP } from '../../document/fixtures'
import type { TemplateId } from '../../document/tokens'
import { DocumentPage } from '../DocumentPage'

const SAMPLE = FIXTURE_MAP['invoice-simple']
const PAGE_WIDTH = 794
const THUMB_WIDTH = 128

// The top of a sample invoice in this template, scaled down; decorative, so hidden from assistive tech and input.
export const TemplateThumbnail = memo(function TemplateThumbnail({ template }: { template: TemplateId }) {
  const scale = THUMB_WIDTH / PAGE_WIDTH
  return (
    <span aria-hidden="true" inert className="pointer-events-none block aspect-[4/3] w-full overflow-hidden rounded-md bg-white ring-1 ring-foreground/10">
      <span className="block origin-top-left" style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}>
        <DocumentPage model={SAMPLE} template={template} pageSize="a4" />
      </span>
    </span>
  )
})
