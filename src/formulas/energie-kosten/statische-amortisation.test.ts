import { describe, it, expect } from 'vitest'
import { statischeAmortisation } from './statische-amortisation'

describe('Statische Amortisationszeit', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = statischeAmortisation.beispiel
    const ergebnis = statischeAmortisation.compute(bekannt, ziel)
    expect(ergebnis.t).toBeCloseTo(erwartet.t, 0)
  })

  it('Handrechnung: E aus I und t (unabhängig vom Beispiel)', () => {
    // I=15000€, t=3 Jahre -> E=5000€/Jahr
    const ergebnis = statischeAmortisation.compute({ I: 15000, t: 3 * 365.25 * 86400 }, 'E')
    expect(ergebnis.E).toBeCloseTo(5000, 1)
  })

  it('löst auch nach I auf', () => {
    const ergebnis = statischeAmortisation.compute({ t: 4 * 365.25 * 86400, E: 2500 }, 'I')
    expect(ergebnis.I).toBeCloseTo(10000, 1)
  })
})
