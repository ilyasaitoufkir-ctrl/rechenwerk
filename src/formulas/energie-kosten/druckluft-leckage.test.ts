import { describe, it, expect } from 'vitest'
import { druckluftLeckage } from './druckluft-leckage'

describe('Druckluftleckage', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = druckluftLeckage.beispiel
    const ergebnis = druckluftLeckage.compute(bekannt, ziel)
    expect(ergebnis.mdot).toBeCloseTo(erwartet.mdot, 6)
    expect(ergebnis.mehrleistung).toBeCloseTo(erwartet.mehrleistung, 3)
    expect(ergebnis.kostenProJahr).toBeCloseTo(erwartet.kostenProJahr, 2)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // d=3mm, p0=800000 Pa, T0=293,15K, Cd=0,7, ρan=1,2, spezL=0,12kW/(m³/min)=7200 W/(m³/s)
    // tB=4000h=14400000s, Strompreis=0,25€/kWh
    const R_LUFT = 287
    const d = 0.003
    const p0 = 800000
    const T0 = 293.15
    const cd = 0.7
    const A = (Math.PI * d * d) / 4
    const rho0 = p0 / (R_LUFT * T0)
    const kappa = 1.4
    const exp = (kappa + 1) / (kappa - 1)
    const term = kappa * p0 * rho0 * Math.pow(2 / (kappa + 1), exp)
    const mdotErwartet = cd * A * Math.sqrt(term)

    const ergebnis = druckluftLeckage.compute(
      { d, p0, T0, cd, rhoAnsaug: 1.2, spezLeistung: 7200, betriebsstunden: 14400000, strompreis: 0.25 },
      'mdot',
    )
    expect(ergebnis.mdot).toBeCloseTo(mdotErwartet, 9)
  })

  it('wirft Fehler bei Lochdurchmesser <= 0', () => {
    expect(() =>
      druckluftLeckage.compute(
        { d: 0, p0: 1e5, T0: 293.15, cd: 0.6, rhoAnsaug: 1.2, spezLeistung: 6000, betriebsstunden: 3600, strompreis: 0.2 },
        'mdot',
      ),
    ).toThrow()
  })

  it('markiert das Ergebnis als Richtwert', () => {
    expect(druckluftLeckage.richtwert).toBe(true)
  })
})
