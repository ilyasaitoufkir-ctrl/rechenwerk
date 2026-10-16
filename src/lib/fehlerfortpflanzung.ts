/**
 * Gaußsche Fehlerfortpflanzung, generisch über eine beliebige Formel.
 * Partielle Ableitungen werden numerisch per zentralem Differenzenquotienten
 * bestimmt - funktioniert daher mit jeder `compute`-Funktion der Registry,
 * nicht nur mit fest verdrahteten Formeln.
 *
 *   u_f = sqrt( Σ (∂f/∂x_i · u_i)² )
 */

export interface FehlerfortpflanzungsEintrag {
  id: string
  beitrag: number
}

export interface FehlerfortpflanzungsErgebnis {
  basis: number
  kombinierteUnsicherheit: number
  beitraege: FehlerfortpflanzungsEintrag[]
}

export function fehlerfortpflanzung(
  compute: (bekannt: Record<string, number>) => number,
  werte: Record<string, number>,
  unsicherheiten: Record<string, number>,
): FehlerfortpflanzungsErgebnis {
  const ids = Object.keys(werte)
  const basis = compute(werte)
  if (!Number.isFinite(basis)) {
    throw new Error('Ergebnis an der Basisstelle ist nicht definiert')
  }

  const beitraege: FehlerfortpflanzungsEintrag[] = []
  for (const id of ids) {
    const u = unsicherheiten[id] ?? 0
    if (u === 0) {
      beitraege.push({ id, beitrag: 0 })
      continue
    }
    const x = werte[id]
    const h = Math.max(Math.abs(x) * 1e-6, 1e-9)
    const plus = compute({ ...werte, [id]: x + h })
    const minus = compute({ ...werte, [id]: x - h })
    const ableitung = (plus - minus) / (2 * h)
    beitraege.push({ id, beitrag: ableitung * u })
  }

  const kombinierteUnsicherheit = Math.sqrt(beitraege.reduce((s, b) => s + b.beitrag ** 2, 0))
  return { basis, kombinierteUnsicherheit, beitraege }
}
