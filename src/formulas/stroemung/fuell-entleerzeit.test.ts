import { describe, it, expect } from 'vitest'
import { fuellEntleerzeit } from './fuell-entleerzeit'

describe('Füll- und Entleerzeit', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = fuellEntleerzeit.beispiel
    const ergebnis = fuellEntleerzeit.compute(bekannt, ziel)
    expect(ergebnis.t).toBeCloseTo(erwartet.t, 6)
  })

  it('Handrechnung: V̇ aus V und t (unabhängig vom Beispiel)', () => {
    // Handrechnung: V̇ = V/t = 10/1000 = 0,01 m³/s
    const ergebnis = fuellEntleerzeit.compute({ V: 10, t: 1000 }, 'V_dot')
    expect(ergebnis.V_dot).toBeCloseTo(0.01, 9)
  })

  it('löst auch nach V auf', () => {
    const ergebnis = fuellEntleerzeit.compute({ V_dot: 0.01, t: 1000 }, 'V')
    expect(ergebnis.V).toBeCloseTo(10, 9)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => fuellEntleerzeit.compute({ V: 1, V_dot: 0 }, 't')).toThrow()
    expect(() => fuellEntleerzeit.compute({ V: 1, t: 0 }, 'V_dot')).toThrow()
  })
})
