/**
 * Rohrreibungszahl λ.
 *
 * Laminar (Re < 2300): λ = 64 / Re (Hagen-Poiseuille)
 * Turbulent: Colebrook-White, implizit gelöst über Fixpunktiteration
 *   1/√λ = -2 log10( k/(3,71 d) + 2,51/(Re √λ) )
 * Startwert nach Swamee-Jain, Abbruch bei relativer Änderung < 1e-10.
 *
 * Quelle: Sigloch, Technische Fluidmechanik; Bohl/Elmendorf, Technische Strömungslehre.
 */

export const RE_LAMINAR_GRENZE = 2300
export const RE_TURBULENT_GRENZE = 4000

export type Stroemungsregime = 'laminar' | 'uebergang' | 'turbulent'

export function regime(re: number): Stroemungsregime {
  if (re < RE_LAMINAR_GRENZE) return 'laminar'
  if (re < RE_TURBULENT_GRENZE) return 'uebergang'
  return 'turbulent'
}

export function lambdaLaminar(re: number): number {
  if (re <= 0) throw new Error('Reynoldszahl muss größer 0 sein')
  return 64 / re
}

/** Startwert für die Colebrook-White-Iteration nach Swamee-Jain. */
export function swameeJain(re: number, relativeRauheit: number): number {
  const term = relativeRauheit / 3.7 + 5.74 / Math.pow(re, 0.9)
  return 0.25 / Math.pow(Math.log10(term), 2)
}

export interface ColebrookResult {
  lambda: number
  iterationen: number
}

/**
 * Löst Colebrook-White iterativ nach λ.
 * k: absolute Rauheit (m), d: Innendurchmesser (m), re: Reynoldszahl.
 */
export function colebrookWhite(
  re: number,
  k: number,
  d: number,
  maxIterationen = 100,
): ColebrookResult {
  if (re <= 0) throw new Error('Reynoldszahl muss größer 0 sein')
  if (d <= 0) throw new Error('Durchmesser muss größer 0 sein')
  if (k < 0) throw new Error('Rauheit darf nicht negativ sein')

  const relativeRauheit = k / d
  let lambda = swameeJain(re, relativeRauheit)

  for (let i = 0; i < maxIterationen; i++) {
    const rechteSeite = -2 * Math.log10(k / (3.71 * d) + 2.51 / (re * Math.sqrt(lambda)))
    const neuesLambda = 1 / (rechteSeite * rechteSeite)
    const relativeAenderung = Math.abs(neuesLambda - lambda) / lambda
    lambda = neuesLambda
    if (relativeAenderung < 1e-10) {
      return { lambda, iterationen: i + 1 }
    }
  }
  return { lambda, iterationen: maxIterationen }
}

/** Wählt automatisch laminare Formel oder Colebrook-White je nach Regime. */
export function rohrreibungszahl(re: number, k: number, d: number): number {
  if (regime(re) === 'laminar') {
    return lambdaLaminar(re)
  }
  return colebrookWhite(re, k, d).lambda
}
