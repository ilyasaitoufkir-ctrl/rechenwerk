import { describe, it, expect } from 'vitest'
import { sicherheitsventilGasDampf } from './sicherheitsventil-gas-dampf'
import { kritischeAusstroemung } from '../../lib/ausstroemung'

describe('Sicherheitsventil, Gase und Dämpfe', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = sicherheitsventilGasDampf.beispiel
    const ergebnis = sicherheitsventilGasDampf.compute(bekannt, ziel)
    expect(ergebnis.mdot).toBeCloseTo(erwartet.mdot, 6)
  })

  it('Konsistenz mit der kritischen Ausströmung aus Phase 2 bei α_w = C_d', () => {
    const alphaw = 0.65
    const A = 1e-4
    const kappa = 1.4
    const p0 = 1e6
    const rho0 = 10
    const p2 = 1e5 // weit unterkritisch -> kritische (schallnahe) Strömung
    const ergebnis = sicherheitsventilGasDampf.compute({ alphaw, A, kappa, rho0, p0, p2 }, 'mdot')
    const direkt = kritischeAusstroemung(alphaw, A, kappa, p0, rho0)
    expect(ergebnis.mdot).toBeCloseTo(direkt, 9)
  })

  it('Handrechnung: unterkritische Strömung (unabhängig vom Beispiel)', () => {
    // p2/p0=0,9 liegt über dem kritischen Druckverhältnis (~0,528 bei κ=1,4) -> unterkritisch
    const ergebnis = sicherheitsventilGasDampf.compute(
      { alphaw: 0.7, A: 5e-5, kappa: 1.4, rho0: 8, p0: 1e6, p2: 0.9e6 },
      'mdot',
    )
    expect(ergebnis.mdot).toBeGreaterThan(0)
    expect(Number.isFinite(ergebnis.mdot)).toBe(true)
  })

  it('löst auch nach der Querschnittsfläche A auf', () => {
    const vorwaerts = sicherheitsventilGasDampf.compute(
      { alphaw: 0.65, A: 1e-4, kappa: 1.4, rho0: 10, p0: 1e6, p2: 1e5 },
      'mdot',
    )
    const rueckwaerts = sicherheitsventilGasDampf.compute(
      { alphaw: 0.65, mdot: vorwaerts.mdot, kappa: 1.4, rho0: 10, p0: 1e6, p2: 1e5 },
      'A',
    )
    expect(rueckwaerts.A).toBeCloseTo(1e-4, 9)
  })

  it('ist als Richtwert markiert und erklärt die physikalisch hergeleitete SI-Form in den Annahmen', () => {
    expect(sicherheitsventilGasDampf.richtwert).toBe(true)
    expect(sicherheitsventilGasDampf.annahmen.some((a) => a.toLowerCase().includes('physikalisch'))).toBe(true)
  })
})
