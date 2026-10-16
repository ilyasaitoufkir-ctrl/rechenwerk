import { describe, it, expect } from 'vitest'
import { volumenZylinder } from './volumen-zylinder'

describe('Volumen Zylinder', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = volumenZylinder.beispiel
    const ergebnis = volumenZylinder.compute(bekannt, ziel)
    expect(ergebnis.V).toBeCloseTo(erwartet.V, 6)
  })

  it('Handrechnung: löst nach h auf (unabhängig vom Beispiel)', () => {
    // V=0,1 m³, r=0,2m -> h = 0,1/(π*0,04) = 0,795775 m
    const ergebnis = volumenZylinder.compute({ V: 0.1, r: 0.2 }, 'h')
    expect(ergebnis.h).toBeCloseTo(0.795775, 5)
  })

  it('wirft Fehler bei Radius 0', () => {
    expect(() => volumenZylinder.compute({ V: 1, r: 0 }, 'h')).toThrow()
  })
})
