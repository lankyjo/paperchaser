import { PaymentDetails } from '../../document-page/PaymentDetails'
import type { RegionProps } from '../templateLayouts'

// Your payment details under a heavy rule.
export function SwissFooter({ model }: RegionProps) {
  return (
    <footer>
      <PaymentDetails model={model} className="swiss-pay" labelClassName="swiss-pay-label" />
    </footer>
  )
}
