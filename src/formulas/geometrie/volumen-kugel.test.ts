import { describe, it, expect } from 'vitest'
import { volumenKugel } from './volumen-kugel'

describe('Volumen Kugel', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = volumenKugel.beispiel
    const ergebnis = volumenKugel.compute(bekannt, ziel)
    expect(ergebnis.V).toBeCloseTo(erwartet.V, 6)
  })

  it('Handrechnung: löst nach r auf (unabhängig vom Beispiel)', () => {
    // V=1 m³ -> r = (3/(4π))^(1/3) = 0,620350 m
    const ergebnis = volumenKugel.compute({ V: 1 }, 'r')
    expect(ergebnis.r).toBeCloseTo(0.62035, 4)
  })

  it('Rundreise: r -> V -> r', () => {
    const r0 = 0.42
    const v = volumenKugel.compute({ r: r0 }, 'V')
    const r1 = volumenKugel.compute({ V: v.V }, 'r')
    expect(r1.r).toBeCloseTo(r0, 9)
  })
})
