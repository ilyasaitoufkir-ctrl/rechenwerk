import { describe, it, expect } from 'vitest'
import {
  kritischeAusstroemung,
  kritischesDruckverhaeltnis,
  unterkritischeAusstroemung,
  ausstroemung,
} from './ausstroemung'

describe('Kritische Ausströmung idealer Gase', () => {
  it('Handrechnung: Luft, Loch 1mm², 6 bar Überdruck (7 bar abs), Cd=0,62', () => {
    // Handrechnung: κ=1,4, Cd=0,62, A=1e-6 m², p0=700000 Pa, ρ0=8,323 kg/m³
    // ṁ = 0,62 · 1e-6 · sqrt(1,4 · 700000 · 8,323 · (2/2,4)^6) = 0,00102471 kg/s
    const mdot = kritischeAusstroemung(0.62, 1e-6, 1.4, 700000, 8.323)
    expect(mdot).toBeCloseTo(0.0010247099, 8)
  })

  it('kritisches Druckverhältnis für Luft (κ=1,4) ≈ 0,5283', () => {
    expect(kritischesDruckverhaeltnis(1.4)).toBeCloseTo(0.5282817877, 8)
  })

  it('wirft Fehler bei ungültigen Eingaben', () => {
    expect(() => kritischeAusstroemung(0, 1e-6, 1.4, 1e5, 1)).toThrow()
    expect(() => kritischeAusstroemung(0.6, 0, 1.4, 1e5, 1)).toThrow()
    expect(() => kritischeAusstroemung(0.6, 1e-6, 1, 1e5, 1)).toThrow()
    expect(() => kritischeAusstroemung(0.6, 1e-6, 1.4, 0, 1)).toThrow()
    expect(() => kritischeAusstroemung(0.6, 1e-6, 1.4, 1e5, 0)).toThrow()
  })

  it('Durchfluss skaliert linear mit der Öffnungsfläche', () => {
    const m1 = kritischeAusstroemung(0.62, 1e-6, 1.4, 700000, 8.323)
    const m2 = kritischeAusstroemung(0.62, 2e-6, 1.4, 700000, 8.323)
    expect(m2 / m1).toBeCloseTo(2, 9)
  })
})

describe('Unterkritische Ausströmung', () => {
  const cd = 0.8
  const a = 1e-4
  const kappa = 1.4
  const p0 = 7e5
  const rho0 = 8.3

  it('geht am kritischen Druckverhältnis exakt in die kritische Formel über (Konsistenztest)', () => {
    const rc = kritischesDruckverhaeltnis(kappa)
    const unterkritisch = unterkritischeAusstroemung(cd, a, kappa, p0, rho0, p0 * rc)
    const kritisch = kritischeAusstroemung(cd, a, kappa, p0, rho0)
    expect(unterkritisch).toBeCloseTo(kritisch, 9)
  })

  it('Handrechnung: p2=0,8·p0 (unabhängig)', () => {
    // r=0,8: term = 0,8^(2/1,4) - 0,8^(2,4/1,4) = 0,8^1,42857 - 0,8^1,71429
    const r = 0.8
    const term = Math.pow(r, 2 / kappa) - Math.pow(r, (kappa + 1) / kappa)
    const erwartet = cd * a * Math.sqrt(((2 * kappa) / (kappa - 1)) * p0 * rho0 * term)
    expect(unterkritischeAusstroemung(cd, a, kappa, p0, rho0, p0 * r)).toBeCloseTo(erwartet, 9)
  })

  it('Massenstrom nimmt mit steigendem Gegendruck ab', () => {
    const m1 = unterkritischeAusstroemung(cd, a, kappa, p0, rho0, p0 * 0.7)
    const m2 = unterkritischeAusstroemung(cd, a, kappa, p0, rho0, p0 * 0.9)
    expect(m2).toBeLessThan(m1)
  })

  it('wirft Fehler, wenn der Gegendruck über p0 liegt', () => {
    expect(() => unterkritischeAusstroemung(cd, a, kappa, p0, rho0, p0 * 1.1)).toThrow()
  })
})

describe('ausstroemung() wählt automatisch kritisch oder unterkritisch', () => {
  const cd = 0.8
  const a = 1e-4
  const kappa = 1.4
  const p0 = 7e5
  const rho0 = 8.3

  it('wählt kritisch, wenn der Gegendruck unter dem kritischen Druckverhältnis liegt', () => {
    const r = ausstroemung(cd, a, kappa, p0, rho0, p0 * 0.1)
    expect(r.schallnah).toBe(true)
    expect(r.massenstrom).toBeCloseTo(kritischeAusstroemung(cd, a, kappa, p0, rho0), 9)
  })

  it('wählt unterkritisch, wenn der Gegendruck über dem kritischen Druckverhältnis liegt', () => {
    const r = ausstroemung(cd, a, kappa, p0, rho0, p0 * 0.9)
    expect(r.schallnah).toBe(false)
    expect(r.massenstrom).toBeCloseTo(unterkritischeAusstroemung(cd, a, kappa, p0, rho0, p0 * 0.9), 9)
  })
})
