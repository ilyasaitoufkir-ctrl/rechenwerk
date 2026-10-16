import { describe, it, expect } from 'vitest'
import { fuehlbareWaermeLeistung } from './fuehlbare-waerme-leistung'

describe('Fühlbare Wärme (Wärmestrom)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = fuehlbareWaermeLeistung.beispiel
    const ergebnis = fuehlbareWaermeLeistung.compute(bekannt, ziel)
    expect(ergebnis.Q_dot).toBeCloseTo(erwartet.Q_dot, 3)
  })

  it('Handrechnung: ΔT aus Q̇, ṁ, cp (unabhängig vom Beispiel)', () => {
    // Handrechnung: ΔT = Q̇/(ṁ*cp) = 10000/(0,2*4182) = 11,9560... K
    const ergebnis = fuehlbareWaermeLeistung.compute({ Q_dot: 10000, m_dot: 0.2, cp: 4182 }, 'dT')
    expect(ergebnis.dT).toBeCloseTo(11.956, 2)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => fuehlbareWaermeLeistung.compute({ Q_dot: 100, m_dot: 0, cp: 4182 }, 'dT')).toThrow()
  })
})
