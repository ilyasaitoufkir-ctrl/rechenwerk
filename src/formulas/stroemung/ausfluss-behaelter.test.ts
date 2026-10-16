import { describe, it, expect } from 'vitest'
import { ausflussBehaelter } from './ausfluss-behaelter'

describe('Ausfluss aus Behälter', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = ausflussBehaelter.beispiel
    const ergebnis = ausflussBehaelter.compute(bekannt, ziel)
    expect(ergebnis.v).toBeCloseTo(erwartet.v, 6)
    expect(ergebnis.V_dot).toBeCloseTo(erwartet.V_dot, 6)
  })

  it('Handrechnung: gut gerundete Öffnung, μ=0,98, h=2 m, A=0,002 m² (unabhängig vom Beispiel)', () => {
    // Handrechnung: v = 0,98*sqrt(2*9,80665*2) = 0,98*6,26311 = 6,137852 m/s
    // V̇ = v*A = 6,137852*0,002 = 0,01227570 m³/s
    const ergebnis = ausflussBehaelter.compute({ mu: 0.98, h: 2, A: 0.002 }, 'V_dot')
    expect(ergebnis.v).toBeCloseTo(6.137852, 5)
    expect(ergebnis.V_dot).toBeCloseTo(0.0122757, 6)
  })

  it('wirft Fehler bei negativer Füllhöhe', () => {
    expect(() => ausflussBehaelter.compute({ mu: 0.6, h: -1, A: 0.001 }, 'V_dot')).toThrow()
  })

  it('warnt bei unplausibler Ausflusszahl', () => {
    expect(
      ausflussBehaelter.warnungen?.({ mu: 1.5, h: 1, A: 0.001 }, 'V_dot', {}).length,
    ).toBeGreaterThan(0)
    expect(
      ausflussBehaelter.warnungen?.({ mu: 0, h: 1, A: 0.001 }, 'V_dot', {}).length,
    ).toBeGreaterThan(0)
  })
})
