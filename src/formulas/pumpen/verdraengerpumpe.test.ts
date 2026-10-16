import { describe, it, expect } from 'vitest'
import { verdraengerpumpe } from './verdraengerpumpe'

describe('Verdränger- und Dosierpumpe', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = verdraengerpumpe.beispiel
    const ergebnis = verdraengerpumpe.compute(bekannt, ziel)
    expect(ergebnis.V_dot).toBeCloseTo(erwartet.V_dot, 8)
  })

  it('Handrechnung: n aus V̇, VHub, ηvol (unabhängig vom Beispiel)', () => {
    // V̇=5e-6 m³/s, VHub=5e-6 m³, ηvol=0,8 -> n = 5e-6/(5e-6*0,8) = 1,25 1/s
    const ergebnis = verdraengerpumpe.compute({ V_dot: 5e-6, VHub: 5e-6, etaVol: 0.8 }, 'n')
    expect(ergebnis.n).toBeCloseTo(1.25, 6)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => verdraengerpumpe.compute({ V_dot: 1e-5, n: 0, etaVol: 0.9 }, 'VHub')).toThrow()
  })

  it('warnt bei Wirkungsgrad über 100%', () => {
    const warnungen = verdraengerpumpe.warnungen?.({ etaVol: 1.2 } as Record<string, number>, 'V_dot', {}) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
