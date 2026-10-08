import { SAMPLE_BANK, SAMPLE_SENDER, type SampleSheet } from '../../strings/landingSamples'

// The end of a sample sheet: signatures, payment details on money documents, and the sender line.
export function SheetFooter({ sheet }: { sheet: SampleSheet }) {
  return (
    <>
      {sheet.signed && (
        <div className="sign">
          <div><span className="sig">{SAMPLE_SENDER.signer}</span><br />{SAMPLE_SENDER.name}</div>
          {sheet.clientSigns && <div><br /><br />Client signature</div>}
        </div>
      )}
      {sheet.paymentRef && (
        <div className="pay">
          <em>Payment details</em>
          {[...SAMPLE_BANK, ['Reference', sheet.paymentRef]].map(([k, v]) => <span key={k} className="contents"><span>{k}</span><span>{v}</span></span>)}
        </div>
      )}
      <div className="foot">
        <span><b>{SAMPLE_SENDER.name}</b> · {SAMPLE_SENDER.email} · {SAMPLE_SENDER.address}</span>
        <span>Page 1 of 1</span>
      </div>
    </>
  )
}
