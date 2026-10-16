import { describe, it, expect } from 'vitest'
import { fuehlbareWaermeEnergie } from './fuehlbare-waerme-energie'

describe('Fühlbare Wärme (Energie)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = fuehlbareWaermeEnergie.beispiel
    const ergebnis = fuehlbareWaermeEnergie.compute(bekannt, ziel)
    expect(ergebnis.Q).toBeCloseTo(erwartet.Q, 3)
  })

  it('Handrechnung: m aus Q, cp, ΔT (unabhängig vom Beispiel)', () => {
    // Handrechnung: m = Q/(cp*ΔT) = 500000/(900*25) = 22,222 kg
    const ergebnis = fuehlbareWaermeEnergie.compute({ Q: 500000, cp: 900, dT: 25 }, 'm')
    expect(ergebnis.m).toBeCloseTo(22.2222, 3)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => fuehlbareWaermeEnergie.compute({ Q: 100, cp: 0, dT: 10 }, 'm')).toThrow()
  })
})
