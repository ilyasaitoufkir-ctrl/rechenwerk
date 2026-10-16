import { describe, it, expect } from 'vitest'
import { pumpenleistung } from './pumpenleistung'

describe('Pumpenleistung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = pumpenleistung.beispiel
    const ergebnis = pumpenleistung.compute(bekannt, ziel)
    expect(ergebnis.Phyd).toBeCloseTo(erwartet.Phyd, 2)
    expect(ergebnis.PWelle).toBeCloseTo(erwartet.PWelle, 1)
    expect(ergebnis.Pel).toBeCloseTo(erwartet.Pel, 1)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // ρ=1000, V̇=0,02 m³/s, H=15m, ηP=0,7, ηM=0,9
    // Phyd=1000*9,80665*0,02*15=2941,995 W
    // PWelle=2941,995/0,7=4202,85
    // Pel=4202,85/0,9=4669,8333
    const ergebnis = pumpenleistung.compute({ rho: 1000, V_dot: 0.02, H: 15, etaP: 0.7, etaM: 0.9 }, 'Pel')
    expect(ergebnis.Phyd).toBeCloseTo(2941.995, 2)
    expect(ergebnis.PWelle).toBeCloseTo(4202.85, 1)
    expect(ergebnis.Pel).toBeCloseTo(4669.8333, 1)
  })

  it('wirft Fehler bei Wirkungsgrad <= 0', () => {
    expect(() => pumpenleistung.compute({ rho: 1000, V_dot: 0.01, H: 10, etaP: 0, etaM: 0.9 }, 'Pel')).toThrow()
  })
})
