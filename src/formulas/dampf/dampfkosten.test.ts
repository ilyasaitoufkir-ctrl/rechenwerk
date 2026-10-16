import { describe, it, expect } from 'vitest'
import { dampfkosten } from './dampfkosten'

describe('Dampfkosten', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = dampfkosten.beispiel
    const ergebnis = dampfkosten.compute(bekannt, ziel)
    expect(ergebnis.kostenProStunde).toBeCloseTo(erwartet.kostenProStunde, 1)
    expect(ergebnis.kostenProJahr).toBeCloseTo(erwartet.kostenProJahr, -1)
  })

  it('Handrechnung: 2 t/h bei 30€/t, 4000 Betriebsstunden (unabhängig vom Beispiel)', () => {
    // ṁD=2000kg/h=0,55556kg/s, Kosten/h=2*30=60€/h, Kosten/Jahr=60*4000=240000€
    const ergebnis = dampfkosten.compute(
      { m_dot_D: 2000 / 3600, preisProTonne: 30, betriebsstunden: 4000 * 3600 },
      'kostenProStunde',
    )
    expect(ergebnis.kostenProStunde).toBeCloseTo(60, 1)
    expect(ergebnis.kostenProJahr).toBeCloseTo(240000, 0)
  })
})
