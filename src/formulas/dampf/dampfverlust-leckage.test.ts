import { describe, it, expect } from 'vitest'
import { dampfverlustLeckage } from './dampfverlust-leckage'

describe('Dampfverlust durch Leckage', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = dampfverlustLeckage.beispiel
    const ergebnis = dampfverlustLeckage.compute(bekannt, ziel)
    expect(ergebnis.mdot).toBeCloseTo(erwartet.mdot, 7)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // Cd=0,8, A=5mm²=5e-6 m², κ=1,33, p0=1e6 Pa, ρ0=5,15 kg/m³
    const kappa = 1.33
    const exp = (kappa + 1) / (kappa - 1)
    const term = kappa * 1e6 * 5.15 * Math.pow(2 / (kappa + 1), exp)
    const erwartet = 0.8 * 5e-6 * Math.sqrt(term)
    const ergebnis = dampfverlustLeckage.compute({ cd: 0.8, A: 5e-6, kappa, p0: 1e6, rho0: 5.15 }, 'mdot')
    expect(ergebnis.mdot).toBeCloseTo(erwartet, 9)
  })

  it('markiert das Ergebnis als Richtwert/Abschätzung', () => {
    expect(dampfverlustLeckage.richtwert).toBe(true)
    const warnungen = dampfverlustLeckage.warnungen?.({}, 'mdot', {}) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })

  it('wirft Fehler bei ungültigen Eingaben', () => {
    expect(() => dampfverlustLeckage.compute({ cd: 0, A: 1e-6, kappa: 1.33, p0: 1e5, rho0: 1 }, 'mdot')).toThrow()
  })
})
