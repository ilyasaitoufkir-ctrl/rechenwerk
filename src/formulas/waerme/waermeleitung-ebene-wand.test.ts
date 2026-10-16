import { describe, it, expect } from 'vitest'
import { waermeleitungEbeneWand } from './waermeleitung-ebene-wand'

describe('Wärmeleitung, ebene Wand', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = waermeleitungEbeneWand.beispiel
    const ergebnis = waermeleitungEbeneWand.compute(bekannt, ziel)
    expect(ergebnis.Q_dot).toBeCloseTo(erwartet.Q_dot, 6)
  })

  it('Handrechnung: zweischichtige Wand, löst nach A auf (unabhängig vom Beispiel)', () => {
    // Zwei Schichten: s1=0,1m/λ1=0,04 -> R1=2,5 ; s2=0,02m/λ2=0,8 -> R2=0,025
    // R_gesamt = 2,525 m²K/W, Q̇=300W, ΔT=40K -> A = Q̇*R/ΔT = 300*2,525/40 = 18,9375 m²
    const R = 0.1 / 0.04 + 0.02 / 0.8
    const ergebnis = waermeleitungEbeneWand.compute({ Q_dot: 300, dT: 40, R }, 'A')
    expect(ergebnis.A).toBeCloseTo(18.9375, 4)
  })

  it('wirft Fehler bei R <= 0', () => {
    expect(() => waermeleitungEbeneWand.compute({ A: 1, dT: 10, R: 0 }, 'Q_dot')).toThrow()
  })
})
