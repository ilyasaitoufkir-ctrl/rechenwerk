import { describe, it, expect } from 'vitest'
import { mischungskreuz } from './mischungskreuz'

describe('Mischungskreuz', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = mischungskreuz.beispiel
    const ergebnis = mischungskreuz.compute(bekannt, ziel)
    expect(ergebnis.m1).toBeCloseTo(erwartet.m1, 6)
    expect(ergebnis.m2).toBeCloseTo(erwartet.m2, 6)
  })

  it('Handrechnung: Alkohol 96% mit Wasser 0% auf 40% mischen (unabhängig vom Beispiel)', () => {
    // c1=0 (Wasser), c2=0,96, cZiel=0,40, mGesamt=50 kg
    // m1(Wasser) = 50*(0,96-0,40)/(0,96-0) = 50*0,56/0,96 = 29,16667 kg
    const ergebnis = mischungskreuz.compute({ c1: 0, c2: 0.96, cZiel: 0.4, mGesamt: 50 }, 'm1')
    expect(ergebnis.m1).toBeCloseTo(29.16667, 4)
    expect(ergebnis.m2).toBeCloseTo(20.83333, 4)
  })

  it('wirft Fehler, wenn die Zielkonzentration außerhalb von c1 und c2 liegt', () => {
    expect(() => mischungskreuz.compute({ c1: 0.1, c2: 0.4, cZiel: 0.5, mGesamt: 100 }, 'm1')).toThrow()
  })
})
