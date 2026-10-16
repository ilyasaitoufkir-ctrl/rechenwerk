import { describe, it, expect } from 'vitest'
import { kapitalwert } from './kapitalwert'

describe('Kapitalwert', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = kapitalwert.beispiel
    const ergebnis = kapitalwert.compute(bekannt, ziel)
    expect(ergebnis.KW).toBeCloseTo(erwartet.KW, 1)
  })

  it('Handrechnung bei i=0: Kapitalwert = -I + E·n (unabhängig vom Beispiel)', () => {
    // I=30000€, E=6000€/Jahr, n=8 Jahre, i=0 -> KW = -30000+6000*8 = 18000
    const ergebnis = kapitalwert.compute({ I: 30000, E: 6000, i: 0, n: 8 * 365.25 * 86400 }, 'KW')
    expect(ergebnis.KW).toBeCloseTo(18000, 6)
  })
})
