// A YYYY-MM-DD date in the document's locale; older documents without one keep German formatting.
export const formatDocDate = (date: string, locale: string | undefined) => new Date(`${date}T00:00:00`).toLocaleDateString(locale ?? 'de-DE')
