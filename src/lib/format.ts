/** Akzeptiert Komma und Punkt als Dezimaltrenner, z. B. "3,14" oder "3.14". */
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return null // leer heißt "nicht eingegeben", nicht 0
  const hatKomma = trimmed.includes(',')
  const hatMehrerePunkte = (trimmed.match(/\./g) ?? []).length > 1

  let text: string
  if (hatKomma) {
    // Punkte sind Tausendertrennzeichen, Komma ist der Dezimaltrenner
    text = trimmed.replace(/\./g, '').replace(',', '.')
  } else if (hatMehrerePunkte) {
    // Mehrere Punkte ohne Komma -> Punkte sind Tausendertrennzeichen
    text = trimmed.replace(/\./g, '')
  } else {
    // Ein Punkt oder keiner -> Punkt ist der Dezimaltrenner
    text = trimmed
  }

  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

/** Rundet auf eine wählbare Anzahl signifikanter Stellen. */
export function roundToSignificant(value: number, significantDigits: number): number {
  if (value === 0 || !Number.isFinite(value)) return value
  const digits = Math.max(1, significantDigits)
  const magnitude = Math.floor(Math.log10(Math.abs(value)))
  const factor = Math.pow(10, digits - 1 - magnitude)
  return Math.round(value * factor) / factor
}

/** Formatiert eine Zahl für die Anzeige mit signifikanten Stellen, deutsches Dezimalkomma. */
export function formatNumber(value: number, significantDigits = 4): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = roundToSignificant(value, significantDigits)
  const abs = Math.abs(rounded)
  let text: string
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e7)) {
    text = rounded.toExponential(Math.max(0, significantDigits - 1))
  } else {
    const magnitude = rounded === 0 ? 0 : Math.floor(Math.log10(abs))
    const decimals = Math.max(0, significantDigits - 1 - magnitude)
    text = rounded.toFixed(decimals)
  }
  return text.replace('.', ',')
}
