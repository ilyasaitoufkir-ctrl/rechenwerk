import { describe, it, expect } from 'vitest'
import { annuitaet } from './annuitaet'

describe('Annuität', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = annuitaet.beispiel
    const ergebnis = annuitaet.compute(bekannt, ziel)
    expect(ergebnis.a).toBeCloseTo(erwartet.a, 3)
  })

  it('Handrechnung bei i=0: Annuität = E - I/n (unabhängig vom Beispiel)', () => {
    // I=12000€, E=3000€/Jahr, n=6 Jahre, i=0 -> a = 3000-12000/6 = 1000
    const ergebnis = annuitaet.compute({ I: 12000, E: 3000, i: 0, n: 6 * 365.25 * 86400 }, 'a')
    expect(ergebnis.a).toBeCloseTo(1000, 6)
  })
})
