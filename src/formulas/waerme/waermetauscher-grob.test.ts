import { describe, it, expect } from 'vitest'
import { waermetauscherGrob } from './waermetauscher-grob'

describe('Wärmetauscher, Grobauslegung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = waermetauscherGrob.beispiel
    const ergebnis = waermetauscherGrob.compute(bekannt, ziel)
    expect(ergebnis.Q_dot).toBeCloseTo(erwartet.Q_dot, 3)
  })

  it('Handrechnung: A aus Q̇, k, ΔTm (unabhängig vom Beispiel)', () => {
    // A = Q̇/(k*ΔTm) = 120000/(800*25) = 6 m²
    const ergebnis = waermetauscherGrob.compute({ Q_dot: 120000, k: 800, dTm: 25 }, 'A')
    expect(ergebnis.A).toBeCloseTo(6, 9)
  })

  it('wirft Fehler bei ΔTm <= 0', () => {
    expect(() => waermetauscherGrob.compute({ Q_dot: 100, k: 10, dTm: 0 }, 'Q_dot')).toThrow()
  })
})
