// A labelled date under the header, formatted in the document's locale.
export function DateLine({ label, date, locale }: { label: string; date: string; locale: string | undefined }) {
  return (
    <p style={{ margin: '0 0 var(--tpl-section-gap)' }}>
      {label} {new Date(`${date}T00:00:00`).toLocaleDateString(locale ?? 'de-DE')}
    </p>
  )
}
