import { describe, it, expect } from 'vitest'
import { co2Emissionen } from './co2-emissionen'

describe('CO₂-Emissionen', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = co2Emissionen.beispiel
    const ergebnis = co2Emissionen.compute(bekannt, ziel)
    expect(ergebnis.m).toBeCloseTo(erwartet.m, 3)
  })

  it('Handrechnung: E=20000 kWh, f=0,38 kg/kWh (Strommix, unabhängig vom Beispiel)', () => {
    // m = 20000*0,38 = 7600 kg
    const ergebnis = co2Emissionen.compute({ E: 20000 * 3.6e6, f: 0.38 }, 'm')
    expect(ergebnis.m).toBeCloseTo(7600, 3)
  })

  it('Ergebnis in Tonnen entspricht der Handrechnung (Einheitenkonsistenz)', () => {
    const ergebnis = co2Emissionen.compute({ E: 20000 * 3.6e6, f: 0.38 }, 'm')
    // SI ist kg -> 7,6 t
    expect(ergebnis.m / 1000).toBeCloseTo(7.6, 3)
  })
})
