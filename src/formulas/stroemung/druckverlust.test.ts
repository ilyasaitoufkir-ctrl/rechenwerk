import { describe, it, expect } from 'vitest'
import { druckverlust } from './druckverlust'

describe('Druckverlust nach Darcy-Weisbach', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = druckverlust.beispiel
    const ergebnis = druckverlust.compute(bekannt, ziel)
    expect(ergebnis.dp).toBeCloseTo(erwartet.dp, 6)
    expect(ergebnis.h).toBeCloseTo(erwartet.h, 6)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // Handrechnung: λ=0,025, L=50 m, d=0,05 m, Σζ=5, ρ=800 kg/m³, v=1,5 m/s
    // Δp = (0,025*(50/0,05)+5) * 800 * 1,5²/2 = (25+5)*800*1,125 = 30*900 = 27000 Pa
    // h = 27000/(800*9,80665) = 3,441542 m
    const ergebnis = druckverlust.compute(
      { lambda: 0.025, L: 50, d: 0.05, zeta: 5, rho: 800, v: 1.5 },
      'dp',
    )
    expect(ergebnis.dp).toBeCloseTo(27000, 6)
    expect(ergebnis.h).toBeCloseTo(3.441542, 5)
  })

  it('wirft Fehler bei d <= 0', () => {
    expect(() =>
      druckverlust.compute({ lambda: 0.02, L: 10, d: 0, zeta: 0, rho: 1000, v: 1 }, 'dp'),
    ).toThrow()
  })

  it('warnt bei ungewöhnlich hoher Geschwindigkeit', () => {
    const warnungen =
      druckverlust.warnungen?.({ lambda: 0.02, L: 10, d: 0.1, zeta: 0, rho: 1000, v: 20 }, 'dp', {}) ??
      []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
