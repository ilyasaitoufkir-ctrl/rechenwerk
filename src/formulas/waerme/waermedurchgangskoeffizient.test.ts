import { describe, it, expect } from 'vitest'
import { waermedurchgangskoeffizient } from './waermedurchgangskoeffizient'

describe('Wärmedurchgangskoeffizient, ebene Wand', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = waermedurchgangskoeffizient.beispiel
    const ergebnis = waermedurchgangskoeffizient.compute(bekannt, ziel)
    expect(ergebnis.k).toBeCloseTo(erwartet.k, 6)
  })

  it('Handrechnung: α1=8, α2=23, R=0,5 (unabhängig vom Beispiel)', () => {
    // 1/k = 1/8 + 0,5 + 1/23 = 0,125+0,5+0,0434783 = 0,6684783 -> k=1,4959350
    const ergebnis = waermedurchgangskoeffizient.compute({ alpha1: 8, alpha2: 23, R: 0.5 }, 'k')
    expect(ergebnis.k).toBeCloseTo(1.495935, 5)
  })

  it('wirft Fehler bei alpha <= 0', () => {
    expect(() => waermedurchgangskoeffizient.compute({ alpha1: 0, alpha2: 10, R: 0.1 }, 'k')).toThrow()
  })
})
