/**
 * Antoine-Gleichung für den Dampfdruck: log_basis(p) = A - B/(C+T).
 *
 * Tabellenwerke verwenden unterschiedliche Konventionen (log10 oder ln,
 * verschiedene Druck- und Temperatureinheiten). Statt eine Konvention
 * anzunehmen, wird die Logarithmusbasis als expliziter Parameter verlangt
 * (10 für log10, e≈2,718281828 für ln) - Druck und Temperatur bleiben rohe
 * Zahlen in genau der Einheit, die zu den eingegebenen Koeffizienten passt.
 */
export function antoinePsat(A: number, B: number, C: number, T: number, basis: number): number {
  if (basis <= 1) throw new Error('Logarithmusbasis muss größer 1 sein (10 für log10, e≈2,71828 für ln)')
  if (C + T === 0) throw new Error('C + T darf nicht 0 sein')
  return Math.pow(basis, A - B / (C + T))
}

interface AntoineKoeffizienten {
  A: number
  B: number
  C: number
}

/** Bisektion für T mit sicherer Fehlermeldung, falls keine Nullstelle im Suchbereich liegt. */
function loeseT(f: (T: number) => number, tMin: number, tMax: number): number {
  let lo = tMin
  let hi = tMax
  const fLo = f(lo)
  const fHi = f(hi)
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) {
    throw new Error(
      `Keine Lösung im Suchbereich [${tMin}, ${tMax}] gefunden - Koeffizienten, Druck oder Zusammensetzung prüfen`,
    )
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const fMid = f(mid)
    if (fMid === 0) return mid
    if (fLo * fMid < 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

const T_SUCHBEREICH: [number, number] = [-200, 2000]

/** Siedepunkt (Bubble Point) eines idealen binären Gemischs: x1·p1_sat(T) + x2·p2_sat(T) = P. */
export function siedepunkt(
  k1: AntoineKoeffizienten,
  k2: AntoineKoeffizienten,
  basis: number,
  x1: number,
  P: number,
): number {
  if (x1 < 0 || x1 > 1) throw new Error('x1 muss zwischen 0 und 1 liegen')
  const f = (T: number) =>
    x1 * antoinePsat(k1.A, k1.B, k1.C, T, basis) + (1 - x1) * antoinePsat(k2.A, k2.B, k2.C, T, basis) - P
  return loeseT(f, ...T_SUCHBEREICH)
}

/** Taupunkt (Dew Point) eines idealen binären Gemischs: 1 / (y1/p1_sat(T) + y2/p2_sat(T)) = P. */
export function taupunkt(
  k1: AntoineKoeffizienten,
  k2: AntoineKoeffizienten,
  basis: number,
  y1: number,
  P: number,
): number {
  if (y1 < 0 || y1 > 1) throw new Error('y1 muss zwischen 0 und 1 liegen')
  const f = (T: number) => {
    const p1 = antoinePsat(k1.A, k1.B, k1.C, T, basis)
    const p2 = antoinePsat(k2.A, k2.B, k2.C, T, basis)
    return 1 / (y1 / p1 + (1 - y1) / p2) - P
  }
  return loeseT(f, ...T_SUCHBEREICH)
}
