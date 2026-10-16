import type { Quelle } from '../types/formula'

/**
 * Edelstahlrohre nach DIN 11850 Reihe 2 ("Molkereirohr", Lebensmittelindustrie).
 * Besonderheit dieser Reihe: die Nennweite DN entspricht näherungsweise dem
 * Innendurchmesser. Werte aus dem Gedächtnis zusammengestellt - vor
 * verbindlicher Auslegung unbedingt gegen die aktuelle Norm oder ein
 * Herstellerdatenblatt prüfen, daher quelleUnsicher = true.
 */
export interface RohrEintrag {
  dn: number
  aussenDurchmesserMm: number
  wandstaerkeMm: number
  innenDurchmesserMm: number
}

export const pipesDin11850Quelle: Quelle = {
  werk: 'DIN 11850 Reihe 2',
  unsicher: true,
}

export const din11850Reihe2: RohrEintrag[] = [
  { dn: 10, aussenDurchmesserMm: 13, wandstaerkeMm: 1.5, innenDurchmesserMm: 10 },
  { dn: 15, aussenDurchmesserMm: 18, wandstaerkeMm: 1, innenDurchmesserMm: 16 },
  { dn: 20, aussenDurchmesserMm: 23, wandstaerkeMm: 1.5, innenDurchmesserMm: 20 },
  { dn: 25, aussenDurchmesserMm: 29, wandstaerkeMm: 1.5, innenDurchmesserMm: 26 },
  { dn: 32, aussenDurchmesserMm: 35, wandstaerkeMm: 1.5, innenDurchmesserMm: 32 },
  { dn: 40, aussenDurchmesserMm: 41, wandstaerkeMm: 1.5, innenDurchmesserMm: 38 },
  { dn: 50, aussenDurchmesserMm: 53, wandstaerkeMm: 1.5, innenDurchmesserMm: 50 },
  { dn: 65, aussenDurchmesserMm: 70, wandstaerkeMm: 2, innenDurchmesserMm: 66 },
  { dn: 80, aussenDurchmesserMm: 85, wandstaerkeMm: 2, innenDurchmesserMm: 81 },
  { dn: 100, aussenDurchmesserMm: 104, wandstaerkeMm: 2, innenDurchmesserMm: 100 },
  { dn: 125, aussenDurchmesserMm: 129, wandstaerkeMm: 2, innenDurchmesserMm: 125 },
  { dn: 150, aussenDurchmesserMm: 154, wandstaerkeMm: 2, innenDurchmesserMm: 150 },
]

/** Liefert die nächstgrößere Nennweite für einen errechneten Innendurchmesser (m). */
export function naechsteNennweite(innenDurchmesserM: number): RohrEintrag | null {
  const dMm = innenDurchmesserM * 1000
  const passende = din11850Reihe2
    .filter((r) => r.innenDurchmesserMm >= dMm)
    .sort((a, b) => a.innenDurchmesserMm - b.innenDurchmesserMm)
  return passende[0] ?? null
}
