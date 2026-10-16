import { describe, it, expect } from 'vitest'
import { region1, region2, psatT, tsatP, saettigung } from './iapws-if97'

describe('IAPWS-IF97: offizielle Verifikationswerte (mind. 8 signifikante Stellen)', () => {
  it('Region 1: T=300K, p=3MPa -> h ≈ 115,331273 kJ/kg = 115331,273 J/kg', () => {
    const z = region1(300, 3)
    expect(z.h / 1000).toBeCloseTo(115.331273, 6)
  })

  it('Region 1: T=300K, p=3MPa -> v ≈ 0,00100215168 m³/kg', () => {
    const z = region1(300, 3)
    expect(z.v).toBeCloseTo(0.00100215168, 10)
  })

  it('Region 1: T=300K, p=80MPa -> s ≈ 0,368563852 kJ/(kg·K)', () => {
    const z = region1(300, 80)
    expect(z.s / 1000).toBeCloseTo(0.368563852, 6)
  })

  it('Region 1: T=300K, p=80MPa -> cp ≈ 4,01008987 kJ/(kg·K)', () => {
    const z = region1(300, 80)
    expect(z.cp / 1000).toBeCloseTo(4.01008987, 5)
  })

  it('Region 2: T=300K, p=0,0035MPa -> h ≈ 2549,91145 kJ/kg', () => {
    const z = region2(300, 0.0035)
    expect(z.h / 1000).toBeCloseTo(2549.91145, 4)
  })

  it('Region 2: T=700K, p=30MPa -> h ≈ 2631,49474 kJ/kg', () => {
    const z = region2(700, 30)
    expect(z.h / 1000).toBeCloseTo(2631.49474, 4)
  })

  it('Region 2: T=700K, p=0,0035MPa -> s ≈ 10,1749996 kJ/(kg·K)', () => {
    const z = region2(700, 0.0035)
    expect(z.s / 1000).toBeCloseTo(10.1749996, 6)
  })

  it('Region 4: T=300K -> p_s ≈ 0,00353658941 MPa', () => {
    expect(psatT(300)).toBeCloseTo(0.00353658941, 10)
  })

  it('Region 4: p=10MPa -> T_s ≈ 584,149488 K', () => {
    expect(tsatP(10)).toBeCloseTo(584.149488, 5)
  })
})

describe('Plausibilitätstest Sattdampf bei Atmosphärendruck', () => {
  it('1,01325 bar -> T_s ≈ 99,97 °C', () => {
    const s = saettigung({ pMPa: 0.101325 })
    expect(s.T - 273.15).toBeCloseTo(99.97, 1)
  })

  it('1,01325 bar -> Verdampfungsenthalpie r ≈ 2257 kJ/kg', () => {
    const s = saettigung({ pMPa: 0.101325 })
    expect(s.r / 1000).toBeCloseTo(2257, -1) // auf +-10 kJ/kg genau (Literaturwert ca. 2257)
  })
})

describe('Bereichsprüfung: nie extrapolieren', () => {
  it('Region 1 lehnt Dampf ab (p < p_s(T))', () => {
    expect(() => region1(300, 0.001)).toThrow()
  })

  it('Region 2 lehnt Flüssigkeit ab (p > p_s(T) bei T ≤ 623,15K)', () => {
    expect(() => region2(300, 3)).toThrow()
  })

  it('Region 1 lehnt T > 623,15K ab (Region 3 nicht implementiert)', () => {
    expect(() => region1(650, 30)).toThrow()
  })

  it('Region 2 lehnt zu hohen Druck bei T > 623,15K ab (oberhalb der B23-Grenzkurve, Region 3)', () => {
    expect(() => region2(700, 35)).toThrow()
  })

  it('Region 2 akzeptiert (700K, 30MPa) - offizieller Verifikationspunkt unterhalb der B23-Grenzkurve', () => {
    expect(() => region2(700, 30)).not.toThrow()
  })

  it('psatT lehnt T außerhalb 0,01-373,95°C ab', () => {
    expect(() => psatT(100)).toThrow()
    expect(() => psatT(700)).toThrow()
  })

  it('saettigung lehnt T > 623,15K ab', () => {
    expect(() => saettigung({ T: 630 })).toThrow()
  })
})

describe('Konsistenz Region1/Region2 an der Sättigungslinie', () => {
  it('h\'\' > h\' bei gleichem Sättigungszustand (Verdampfungsenthalpie positiv)', () => {
    const s = saettigung({ T: 400 })
    expect(s.r).toBeGreaterThan(0)
  })

  it('Dichte Dampf < Dichte Flüssigkeit bei gleichem Sättigungszustand', () => {
    const s = saettigung({ T: 400 })
    expect(s.dampf.rho).toBeLessThan(s.fluessig.rho)
  })
})
