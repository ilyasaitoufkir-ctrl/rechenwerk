import { describe, it, expect } from 'vitest'
import { grundlastenergie } from './grundlastenergie'

describe('Grundlastenergie aus Leistung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = grundlastenergie.beispiel
    const ergebnis = grundlastenergie.compute(bekannt, ziel)
    expect(ergebnis.eGrundlast).toBeCloseTo(erwartet.eGrundlast, -2)
  })

  it('Handrechnung: P aus E und t (unabhängig vom Beispiel)', () => {
    // P = E/t: E=72000kWh=2,592e11J, t=720h=2592000s -> P=100000W=100kW
    const ergebnis = grundlastenergie.compute({ eGrundlast: 2.592e11, zeitraum: 2592000 }, 'pGrundlast')
    expect(ergebnis.pGrundlast).toBeCloseTo(100000, 1)
  })
})
