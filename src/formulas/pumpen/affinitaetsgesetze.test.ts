import { describe, it, expect } from 'vitest'
import { affinitaetsgesetze } from './affinitaetsgesetze'

describe('Affinitätsgesetze', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = affinitaetsgesetze.beispiel
    const ergebnis = affinitaetsgesetze.compute(bekannt, ziel)
    expect(ergebnis.V2).toBeCloseTo(erwartet.V2, 8)
    expect(ergebnis.H2).toBeCloseTo(erwartet.H2, 6)
    expect(ergebnis.P2).toBeCloseTo(erwartet.P2, 2)
  })

  it('doppelte Drehzahl ergibt doppelten Volumenstrom, vierfache Förderhöhe, achtfache Leistung', () => {
    const ergebnis = affinitaetsgesetze.compute({ n1: 10, n2: 20, V1: 5, H1: 8, P1: 100 }, 'V2')
    expect(ergebnis.V2).toBeCloseTo(10, 9)
    expect(ergebnis.H2).toBeCloseTo(32, 9)
    expect(ergebnis.P2).toBeCloseTo(800, 9)
  })

  it('wirft Fehler bei n1 = 0', () => {
    expect(() => affinitaetsgesetze.compute({ n1: 0, n2: 10, V1: 1, H1: 1, P1: 1 }, 'V2')).toThrow()
  })
})
