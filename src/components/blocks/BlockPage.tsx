import type { Block } from '../../document/blocks'
import { resolveTokens, toCssVars } from '../../document/resolveTokens'
import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import { PageFrame } from '../document-page/PageFrame'
import { footerPresets, headerPresets } from '../document-page/pagePresets'
import { resolveWatermarkText } from '../document-page/resolveWatermarkText'
import { BlockView } from './BlockView'

interface BlockPageProps {
  model: DocumentModel
  template?: TemplateId
  pageSize?: PageSize
  onBlockChange?: (next: Block) => void
}

// A block document on the shared page frame with the template's header and footer; hidden blocks never render.
export function BlockPage({ model, template, pageSize, onBlockChange }: BlockPageProps) {
  const resolved = resolveTokens(template ?? model.template ?? 'minimal', model.branding)
  const HeaderPreset = headerPresets[resolved.header.style]
  const FooterPreset = footerPresets[resolved.footer.style]
  const watermarkText = resolveWatermarkText(model.branding, model.status)
  return (
    <PageFrame
      pageSize={pageSize ?? model.pageSize}
      cssVars={toCssVars(resolved)}
      watermark={watermarkText === null ? null : { text: watermarkText, color: resolved.accent }}
    >
      <HeaderPreset tokens={resolved} model={model} />
      {(model.blocks ?? [])
        .filter((b) => !b.hidden)
        .map((block) => (
          <BlockView key={block.id} block={block} onChange={onBlockChange} />
        ))}
      <FooterPreset tokens={resolved} model={model} />
    </PageFrame>
  )
}
