import { describe, it, expect } from 'vitest'
import { erdgasAbrechnung } from './erdgas-abrechnung'

describe('Erdgasabrechnung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = erdgasAbrechnung.beispiel
    const ergebnis = erdgasAbrechnung.compute(bekannt, ziel)
    expect(ergebnis.E).toBeCloseTo(erwartet.E, -2)
  })

  it('Handrechnung: V=500m³, z=0,95, Hs=10kWh/m³=3,6e7 J/m³ (unabhängig vom Beispiel)', () => {
    // E = 500*0,95*36000000 = 17100000000 J = 4750 kWh
    const ergebnis = erdgasAbrechnung.compute({ V: 500, z: 0.95, Hs: 3.6e7 }, 'E')
    expect(ergebnis.E).toBeCloseTo(17100000000, -2)
    expect(ergebnis.E / 3.6e6).toBeCloseTo(4750, 2)
  })
})
