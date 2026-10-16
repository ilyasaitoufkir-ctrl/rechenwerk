import { describe, it, expect } from 'vitest'
import { volumenQuader } from './volumen-quader'

describe('Volumen Quader', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = volumenQuader.beispiel
    const ergebnis = volumenQuader.compute(bekannt, ziel)
    expect(ergebnis.V).toBeCloseTo(erwartet.V, 9)
  })

  it('Handrechnung: löst nach c auf (unabhängig vom Beispiel)', () => {
    // V=2 m³, a=2m, b=1m -> c=1m
    const ergebnis = volumenQuader.compute({ V: 2, a: 2, b: 1 }, 'c')
    expect(ergebnis.c).toBeCloseTo(1, 9)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => volumenQuader.compute({ V: 1, b: 0, c: 1 }, 'a')).toThrow()
  })
})
