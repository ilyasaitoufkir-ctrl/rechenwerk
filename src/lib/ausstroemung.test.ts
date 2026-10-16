import { describe, it, expect } from 'vitest'
import { kritischeAusstroemung, kritischesDruckverhaeltnis } from './ausstroemung'

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
