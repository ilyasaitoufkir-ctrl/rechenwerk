import { describe, it, expect } from 'vitest'
import { sicherheitsventilFluessigkeit } from './sicherheitsventil-fluessigkeit'

describe('Sicherheitsventil, Flüssigkeiten', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = sicherheitsventilFluessigkeit.beispiel
    const ergebnis = sicherheitsventilFluessigkeit.compute(bekannt, ziel)
    expect(ergebnis.mdot).toBeCloseTo(erwartet.mdot, 6)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // αw=0,75, A=1e-4 m², ρ=850 kg/m³, Δp=3e5 Pa
    // ṁ = 0,75*1e-4*sqrt(2*850*3e5) = 0,75*1e-4*sqrt(5,1e8) = 0,75*1e-4*22583,18 = 1,69374
    const ergebnis = sicherheitsventilFluessigkeit.compute({ alphaw: 0.75, A: 1e-4, rho: 850, dp: 3e5 }, 'mdot')
    expect(ergebnis.mdot).toBeCloseTo(1.69374, 4)
  })

  it('löst auch nach der Querschnittsfläche A auf', () => {
    const vorwaerts = sicherheitsventilFluessigkeit.compute({ alphaw: 0.6, A: 2e-4, rho: 1000, dp: 5e5 }, 'mdot')
    const rueckwaerts = sicherheitsventilFluessigkeit.compute(
      { alphaw: 0.6, mdot: vorwaerts.mdot, rho: 1000, dp: 5e5 },
      'A',
    )
    expect(rueckwaerts.A).toBeCloseTo(2e-4, 9)
  })

  it('wirft Fehler bei negativer Druckdifferenz oder Dichte <= 0', () => {
    expect(() => sicherheitsventilFluessigkeit.compute({ alphaw: 0.6, A: 1e-4, rho: 1000, dp: -1 }, 'mdot')).toThrow()
    expect(() => sicherheitsventilFluessigkeit.compute({ alphaw: 0.6, A: 1e-4, rho: 0, dp: 1e5 }, 'mdot')).toThrow()
  })
})
