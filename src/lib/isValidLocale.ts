// True for a single well-formed BCP 47 locale tag such as "en-GB".
export function isValidLocale(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1
  } catch {
    return false
  }
}
