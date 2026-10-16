import { describe, it, expect } from 'vitest'
import { dampfZustandDampf } from './dampf-zustand-dampf'

describe('Wasserdampf, Zustand (Region 2)', () => {
  it('reproduziert das hinterlegte Beispiel (offizieller IAPWS-Verifikationspunkt)', () => {
    const { bekannt, ziel, erwartet } = dampfZustandDampf.beispiel
    const ergebnis = dampfZustandDampf.compute(bekannt, ziel)
    expect(ergebnis.h).toBeCloseTo(erwartet.h, 1)
  })

  it('Handrechnung: T=700K, p=30MPa -> h ≈ 2631,49474 kJ/kg (unabhängig vom Beispiel, offizieller IAPWS-Verifikationspunkt)', () => {
    const ergebnis = dampfZustandDampf.compute({ T: 700, p: 30e6 }, 'h')
    expect(ergebnis.h / 1000).toBeCloseTo(2631.49474, 3)
  })

  it('lehnt Flüssigkeit (p oberhalb Sättigungsdruck bei T<623,15K) ab', () => {
    expect(() => dampfZustandDampf.compute({ T: 300, p: 3e6 }, 'h')).toThrow()
  })

  it('akzeptiert hohe Temperatur bei moderatem Druck (oberhalb 623,15K, unterhalb B23-Grenze)', () => {
    expect(() => dampfZustandDampf.compute({ T: 700, p: 30e6 }, 'h')).not.toThrow()
  })

  it('lehnt zu hohen Druck oberhalb der B23-Grenzkurve ab', () => {
    expect(() => dampfZustandDampf.compute({ T: 700, p: 35e6 }, 'h')).toThrow()
  })
})
