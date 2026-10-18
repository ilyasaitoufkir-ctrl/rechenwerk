import type { StoffStuetzstelle } from './storage'

export type StoffEigenschaft = 'dichteKgM3' | 'viskositaetPas' | 'cpJkgK' | 'lambdaWmK'

export interface InterpolationsErgebnis {
  wert: number
  ausserhalbBereich: boolean
}

/**
 * Lineare Interpolation einer Stoffeigenschaft über die Temperatur-
 * Stützstellen eines eigenen Stoffs. An einer Stützstelle exakt der dort
 * hinterlegte Wert, dazwischen linear interpoliert, außerhalb des Bereichs
 * wird der Randwert geliefert und `ausserhalbBereich: true` gesetzt.
 * Liefert `null`, wenn keine Stützstelle die gesuchte Eigenschaft enthält.
 */
export function interpoliereStoffwert(
  stuetzstellen: StoffStuetzstelle[],
  eigenschaft: StoffEigenschaft,
  temperaturK: number,
): InterpolationsErgebnis | null {
  const punkte = stuetzstellen
    .filter((s) => s[eigenschaft] !== undefined)
    .map((s) => ({ t: s.temperaturK, wert: s[eigenschaft]! }))
    .sort((a, b) => a.t - b.t)

  if (punkte.length === 0) return null
  if (punkte.length === 1) {
    return { wert: punkte[0].wert, ausserhalbBereich: temperaturK !== punkte[0].t }
  }

  const erste = punkte[0]
  const letzte = punkte[punkte.length - 1]

  if (temperaturK <= erste.t) {
    return { wert: erste.wert, ausserhalbBereich: temperaturK < erste.t }
  }
  if (temperaturK >= letzte.t) {
    return { wert: letzte.wert, ausserhalbBereich: temperaturK > letzte.t }
  }

  for (let i = 0; i < punkte.length - 1; i++) {
    const a = punkte[i]
    const b = punkte[i + 1]
    if (temperaturK >= a.t && temperaturK <= b.t) {
      if (a.t === b.t) return { wert: a.wert, ausserhalbBereich: false }
      const anteil = (temperaturK - a.t) / (b.t - a.t)
      return { wert: a.wert + anteil * (b.wert - a.wert), ausserhalbBereich: false }
    }
  }
  // Unerreichbar bei sortierten Punkten und obigen Randfällen, nur für TypeScript.
  return { wert: letzte.wert, ausserhalbBereich: true }
}

/** Liefert den aktuell gültigen Wert eines Stoffs für eine Eigenschaft bei gegebener Temperatur -
 * nutzt die Stützstellentabelle, wenn vorhanden, sonst den festen Wert. */
export function stoffwertBeiTemperatur(
  stoff: { stuetzstellen?: StoffStuetzstelle[] } & Partial<Record<StoffEigenschaft, number>>,
  eigenschaft: StoffEigenschaft,
  temperaturK: number,
): InterpolationsErgebnis | null {
  if (stoff.stuetzstellen && stoff.stuetzstellen.length > 0) {
    return interpoliereStoffwert(stoff.stuetzstellen, eigenschaft, temperaturK)
  }
  const fest = stoff[eigenschaft]
  if (fest === undefined) return null
  return { wert: fest, ausserhalbBereich: false }
}
