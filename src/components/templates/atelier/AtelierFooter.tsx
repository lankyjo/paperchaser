import { PaymentDetails } from '../../document-page/PaymentDetails'
import type { RegionProps } from '../templateLayouts'

// Your payment details in small type under the totals.
export function AtelierFooter({ model }: RegionProps) {
  return (
    <footer>
      <PaymentDetails model={model} className="atelier-pay" labelClassName="atelier-label" />
    </footer>
  )
}
