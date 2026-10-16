import { describe, it, expect } from 'vitest'
import { rohrAuslegen } from './rohr-auslegen'
import { naechsteNennweite } from '../../data/pipes-din11850'

describe('Rohrdurchmesser auslegen', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = rohrAuslegen.beispiel
    const ergebnis = rohrAuslegen.compute(bekannt, ziel)
    expect(ergebnis.d).toBeCloseTo(erwartet.d, 8)
  })

  it('Handrechnung: V̇ = 0,0005 m³/s, v = 1 m/s (unabhängig vom Beispiel)', () => {
    // Handrechnung: d = sqrt(4*0,0005/(π*1)) = sqrt(0,0006366...) = 0,0252313 m
    const ergebnis = rohrAuslegen.compute({ V_dot: 0.0005, v: 1 }, 'd')
    expect(ergebnis.d).toBeCloseTo(0.0252313, 6)
  })

  it('wirft Fehler bei v <= 0', () => {
    expect(() => rohrAuslegen.compute({ V_dot: 0.001, v: 0 }, 'd')).toThrow()
    expect(() => rohrAuslegen.compute({ V_dot: 0.001, v: -1 }, 'd')).toThrow()
  })

  it('empfiehlt die nächstgrößere Nennweite', () => {
    const empfehlung = rohrAuslegen.empfehlung?.({ d: 0.049 })
    expect(empfehlung).toContain('DN 50')
    expect(naechsteNennweite(0.049)?.dn).toBe(50)
  })

  it('gibt null zurück, wenn kein Rohr groß genug ist', () => {
    expect(naechsteNennweite(1)).toBeNull()
  })
})
