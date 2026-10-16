import { describe, it, expect } from 'vitest'
import { colebrookWhite, lambdaLaminar, regime, rohrreibungszahl, swameeJain } from './colebrook'

describe('Regime-Einordnung', () => {
  it('laminar unter 2300', () => {
    expect(regime(1000)).toBe('laminar')
    expect(regime(2299)).toBe('laminar')
  })
  it('Übergangsbereich zwischen 2300 und 4000', () => {
    expect(regime(2300)).toBe('uebergang')
    expect(regime(3500)).toBe('uebergang')
  })
  it('turbulent ab 4000', () => {
    expect(regime(4000)).toBe('turbulent')
    expect(regime(1e6)).toBe('turbulent')
  })
})

describe('Laminare Rohrreibungszahl λ = 64/Re', () => {
  it('Re = 1000 -> λ = 0,064', () => {
    expect(lambdaLaminar(1000)).toBeCloseTo(0.064, 10)
  })
  it('wirft Fehler bei Re <= 0', () => {
    expect(() => lambdaLaminar(0)).toThrow()
    expect(() => lambdaLaminar(-10)).toThrow()
  })
})

describe('Colebrook-White gegen Literaturwerte (Moody-Diagramm)', () => {
  it('hydraulisch glatt (k/d -> 0) bei Re = 1e5 stimmt mit Blasius überein (Abweichung < 2 %)', () => {
    // Blasius: λ = 0,316 / Re^0,25 für glatte Rohre, 4000 < Re < 1e5
    const blasius = 0.316 / Math.pow(1e5, 0.25)
    const { lambda } = colebrookWhite(1e5, 1e-9, 0.1)
    expect(Math.abs(lambda - blasius) / blasius).toBeLessThan(0.02)
    expect(blasius).toBeCloseTo(0.0178, 3)
  })

  it('rauer Fall aus dem Moody-Diagramm: Re = 1e6, k/d = 0,001 -> λ ≈ 0,0199', () => {
    // Literaturwert für relative Rauheit 0,001 bei Re = 1e6 (Moody-Diagramm / Colebrook-Tabellenwerte)
    const d = 0.1
    const k = 0.001 * d
    const { lambda } = colebrookWhite(1e6, k, d)
    expect(lambda).toBeCloseTo(0.0199, 3)
  })

  it('Fixpunktiteration konvergiert (relative Änderung < 1e-10) innerhalb wenigstens Iterationen', () => {
    const { iterationen } = colebrookWhite(50000, 0.00015, 0.05)
    expect(iterationen).toBeLessThan(20)
  })

  it('Swamee-Jain-Startwert liegt nahe am konvergierten Ergebnis', () => {
    const re = 1e5
    const relRauheit = 0.0001
    const start = swameeJain(re, relRauheit)
    const { lambda } = colebrookWhite(re, relRauheit * 0.1, 0.1)
    expect(Math.abs(start - lambda) / lambda).toBeLessThan(0.05)
  })

  it('wirft Fehler bei ungültigen Eingaben', () => {
    expect(() => colebrookWhite(0, 0.001, 0.1)).toThrow()
    expect(() => colebrookWhite(1e5, 0.001, 0)).toThrow()
    expect(() => colebrookWhite(1e5, -0.001, 0.1)).toThrow()
  })
})

describe('rohrreibungszahl() wählt automatisch laminar oder Colebrook-White', () => {
  it('nutzt 64/Re im laminaren Bereich', () => {
    expect(rohrreibungszahl(1500, 0.0001, 0.05)).toBeCloseTo(64 / 1500, 10)
  })
  it('nutzt Colebrook-White im turbulenten Bereich', () => {
    const lambda = rohrreibungszahl(1e5, 1e-9, 0.1)
    const blasius = 0.316 / Math.pow(1e5, 0.25)
    expect(Math.abs(lambda - blasius) / blasius).toBeLessThan(0.02)
  })
})
