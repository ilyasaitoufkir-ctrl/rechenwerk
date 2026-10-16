import { describe, it, expect } from 'vitest'
import { dimensions, dynamicToKinematic, kinematicToDynamic } from './index'

describe('Einheiten: Rundreise (toSI dann fromSI ergibt Ausgangswert)', () => {
  for (const dim of Object.values(dimensions)) {
    describe(dim.label, () => {
      for (const unit of dim.units) {
        it(`${unit.label} (${unit.id})`, () => {
          const testValues = [1, 0, -5, 123.456, 1e-3, 1e6]
          for (const v of testValues) {
            const si = unit.toSI(v)
            const back = unit.fromSI(si)
            expect(back).toBeCloseTo(v, 6)
          }
        })
      }
    })
  }
})

describe('Einheiten: Querverprobung bekannter Faktoren', () => {
  it('1 bar = 100000 Pa', () => {
    const bar = dimensions.pressure.units.find((u) => u.id === 'bar')!
    expect(bar.toSI(1)).toBeCloseTo(100000, 6)
  })

  it('1 m³/h = 1/3600 m³/s', () => {
    const m3h = dimensions.volumeFlow.units.find((u) => u.id === 'm3h')!
    expect(m3h.toSI(1)).toBeCloseTo(1 / 3600, 9)
  })

  it('100 °C = 373,15 K', () => {
    const c = dimensions.temperature.units.find((u) => u.id === 'C')!
    expect(c.toSI(100)).toBeCloseTo(373.15, 6)
  })

  it('32 °F = 273,15 K (Gefrierpunkt Wasser)', () => {
    const f = dimensions.temperature.units.find((u) => u.id === 'F')!
    expect(f.toSI(32)).toBeCloseTo(273.15, 3)
  })

  it('Temperaturdifferenz 18 °F-Differenz = 10 K-Differenz', () => {
    const f = dimensions.temperatureDelta.units.find((u) => u.id === 'F')!
    expect(f.toSI(18)).toBeCloseTo(10, 6)
  })

  it('1 mbar = 100 Pa', () => {
    const mbar = dimensions.pressure.units.find((u) => u.id === 'mbar')!
    expect(mbar.toSI(1)).toBeCloseTo(100, 6)
  })

  it('1 cP = 1 mPa·s', () => {
    const cP = dimensions.dynamicViscosity.units.find((u) => u.id === 'cP')!
    const mPas = dimensions.dynamicViscosity.units.find((u) => u.id === 'mPas')!
    expect(cP.toSI(1)).toBeCloseTo(mPas.toSI(1), 9)
  })

  it('1 cSt = 1 mm²/s', () => {
    const cSt = dimensions.kinematicViscosity.units.find((u) => u.id === 'cSt')!
    const mm2s = dimensions.kinematicViscosity.units.find((u) => u.id === 'mm2s')!
    expect(cSt.toSI(1)).toBeCloseTo(mm2s.toSI(1), 9)
  })
})

describe('Dynamisch <-> kinematisch über ν = η / ρ', () => {
  it('Wasser bei 20°C: η ≈ 1,002 mPa·s, ρ = 998,2 kg/m³ -> ν ≈ 1,0039e-6 m²/s', () => {
    // Handrechnung: ν = 0,001002 / 998,2 = 1,00380...e-6
    const nu = dynamicToKinematic(0.001002, 998.2)
    expect(nu).toBeCloseTo(1.0038e-6, 9)
  })

  it('Rundreise: η -> ν -> η', () => {
    const eta = 0.0015
    const rho = 1050
    const nu = dynamicToKinematic(eta, rho)
    const back = kinematicToDynamic(nu, rho)
    expect(back).toBeCloseTo(eta, 12)
  })

  it('wirft Fehler bei Dichte <= 0', () => {
    expect(() => dynamicToKinematic(0.001, 0)).toThrow()
    expect(() => dynamicToKinematic(0.001, -1)).toThrow()
  })
})
