import { describe, it, expect } from 'vitest'
import { kondensatorWaermelast } from './kondensator-waermelast'

describe('Wärmelast Kondensator und Verdampfer', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = kondensatorWaermelast.beispiel
    const ergebnis = kondensatorWaermelast.compute(bekannt, ziel)
    expect(ergebnis.QK).toBeCloseTo(erwartet.QK, 1)
    expect(ergebnis.QB).toBeCloseTo(ergebnis.QK, 9)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // D=50 kg/h=0,013889 kg/s, R=3, r=1000000 J/kg -> QK=0,013889*4*1000000=55555,56 W
    const ergebnis = kondensatorWaermelast.compute({ D: 50 / 3600, R: 3, r: 1e6 }, 'QK')
    expect(ergebnis.QK).toBeCloseTo(55555.56, 1)
  })

  it('Verdampferleistung entspricht der vereinfachten Annahme Q̇B ≈ Q̇K', () => {
    const ergebnis = kondensatorWaermelast.compute({ D: 50 / 3600, R: 3, r: 1e6 }, 'QK')
    expect(ergebnis.QB).toBe(ergebnis.QK)
  })
})
