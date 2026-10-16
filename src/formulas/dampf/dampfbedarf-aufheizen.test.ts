import { describe, it, expect } from 'vitest'
import { dampfbedarfAufheizen } from './dampfbedarf-aufheizen'

describe('Dampfbedarf zum Aufheizen', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = dampfbedarfAufheizen.beispiel
    const ergebnis = dampfbedarfAufheizen.compute(bekannt, ziel)
    expect(ergebnis.m_dot_D).toBeCloseTo(erwartet.m_dot_D, 6)
  })

  it('Handrechnung: Q̇ aus ṁD, hDampf, hKondensat (unabhängig vom Beispiel)', () => {
    // Q̇ = ṁD*(hDampf-hKondensat) = 0,1*(2700000-500000) = 220000 W
    const ergebnis = dampfbedarfAufheizen.compute({ m_dot_D: 0.1, hDampf: 2700000, hKondensat: 500000 }, 'Q_dot')
    expect(ergebnis.Q_dot).toBeCloseTo(220000, 3)
  })

  it('wirft Fehler, wenn hDampf nicht größer als hKondensat ist', () => {
    expect(() => dampfbedarfAufheizen.compute({ Q_dot: 1000, hDampf: 400000, hKondensat: 500000 }, 'm_dot_D')).toThrow()
  })
})
