import { describe, it, expect } from 'vitest'
import { kontinuitaet } from './kontinuitaet'

describe('Kontinuitätsgleichung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = kontinuitaet.beispiel
    const ergebnis = kontinuitaet.compute(bekannt, ziel)
    expect(ergebnis.V_dot).toBeCloseTo(erwartet.V_dot, 8)
  })

  it('Handrechnung: v aus A und V̇ (unabhängig vom Beispiel)', () => {
    // Handrechnung: A = 0,005 m², V̇ = 0,02 m³/s -> v = V̇/A = 0,02/0,005 = 4 m/s
    const ergebnis = kontinuitaet.compute({ A: 0.005, V_dot: 0.02 }, 'v')
    expect(ergebnis.v).toBeCloseTo(4, 9)
  })

  it('löst auch nach A auf', () => {
    const ergebnis = kontinuitaet.compute({ V_dot: 0.02, v: 4 }, 'A')
    expect(ergebnis.A).toBeCloseTo(0.005, 9)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => kontinuitaet.compute({ V_dot: 1, v: 0 }, 'A')).toThrow()
    expect(() => kontinuitaet.compute({ V_dot: 1, A: 0 }, 'v')).toThrow()
  })

  it('warnt bei ungewöhnlich hoher Geschwindigkeit', () => {
    const warnungen = kontinuitaet.warnungen?.({ A: 0.001, V_dot: 1 }, 'v', { v: 1000 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
