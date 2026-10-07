import { PaymentDetails } from '../../document-page/PaymentDetails'
import type { RegionProps } from '../templateLayouts'

// Your payment details in a bordered box under the totals.
export function NoirLedgerFooter({ model }: RegionProps) {
  return (
    <footer>
      <PaymentDetails model={model} className="noir-pay" labelClassName="noir-pay-label" />
    </footer>
  )
}
