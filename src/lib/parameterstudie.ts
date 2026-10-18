/**
 * Parameterstudie: variiert eine Eingabe einer Formel über einen Bereich, alle übrigen Eingaben
 * bleiben fest. Nutzt ausschließlich formel.compute() - rechnet also für jeden Punkt exakt das,
 * was ein einzelner Rechner-Aufruf mit diesem Eingabewert auch liefern würde.
 */
import type { Formula } from '../types/formula'

export type StudienModus = 'linear' | 'log'

/** Erzeugt `anzahl` Stützwerte zwischen `von` und `bis` (SI), linear oder logarithmisch verteilt. */
export function parameterstudieBereich(von: number, bis: number, anzahl: number, modus: StudienModus): number[] {
  if (anzahl < 2) return [von]
  if (modus === 'log' && (von <= 0 || bis <= 0)) {
    throw new Error('Logarithmische Verteilung erfordert Werte größer 0')
  }
  const pts: number[] = []
  for (let i = 0; i < anzahl; i++) {
    const t = i / (anzahl - 1)
    pts.push(modus === 'log' ? von * Math.pow(bis / von, t) : von + (bis - von) * t)
  }
  return pts
}

export interface ParameterstudiePunkt {
  x: number
  y: number | null
  y2: number | null
  hinweis?: string
}

/**
 * Berechnet für jeden Stützwert von `variierteId` das Ergebnis `ziel` (und optional eine zweite
 * Ausgabe `zweiteAusgabeId`) über formel.compute() - identisch zu einer Einzelrechnung mit genau
 * diesem Eingabewert. Punkte außerhalb des Gültigkeitsbereichs (min/max der Variable, Rechenfehler,
 * nicht-endliches Ergebnis) werden als Lücke (y: null) mit Hinweis markiert statt verbunden.
 */
export function parameterstudieBerechnen(
  formel: Formula,
  ziel: string,
  variierteId: string,
  werteSI: number[],
  bekanntRestSI: Record<string, number>,
  zweiteAusgabeId?: string,
): ParameterstudiePunkt[] {
  const variable = formel.variablen.find((v) => v.id === variierteId)
  return werteSI.map((x) => {
    if (variable?.min !== undefined && x < variable.min) {
      return { x, y: null, y2: null, hinweis: 'außerhalb des gültigen Bereichs (< Minimum)' }
    }
    if (variable?.max !== undefined && x > variable.max) {
      return { x, y: null, y2: null, hinweis: 'außerhalb des gültigen Bereichs (> Maximum)' }
    }
    try {
      const roh = formel.compute({ ...bekanntRestSI, [variierteId]: x }, ziel)
      const y = roh[ziel]
      if (!Number.isFinite(y)) {
        return { x, y: null, y2: null, hinweis: 'Ergebnis an dieser Stelle nicht definiert' }
      }
      const y2 = zweiteAusgabeId !== undefined ? roh[zweiteAusgabeId] ?? null : null
      return { x, y, y2: Number.isFinite(y2) ? y2 : null }
    } catch (e) {
      return { x, y: null, y2: null, hinweis: e instanceof Error ? e.message : 'Rechenfehler' }
    }
  })
}
