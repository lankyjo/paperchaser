import type { ComponentType } from 'react'
import type { FooterStyle, HeaderStyle, ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import { FooterDetailed } from '../print/FooterDetailed'
import { FooterMinimal } from '../print/FooterMinimal'
import { FooterStandard } from '../print/FooterStandard'
import { HeaderBanner } from '../print/HeaderBanner'
import { HeaderCompact } from '../print/HeaderCompact'
import { HeaderStandard } from '../print/HeaderStandard'

export interface PresetProps {
  tokens: ResolvedTokens
  model: DocumentModel
}

// Header preset per resolved header style; standard-offset reuses HeaderStandard with a page-level offset.
export const headerPresets: Record<HeaderStyle, ComponentType<PresetProps>> = {
  standard: HeaderStandard,
  banner: HeaderBanner,
  compact: HeaderCompact,
  'standard-offset': HeaderStandard,
}

export const footerPresets: Record<FooterStyle, ComponentType<PresetProps>> = {
  minimal: FooterMinimal,
  standard: FooterStandard,
  detailed: FooterDetailed,
}
