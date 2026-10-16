import { describe, it, expect } from 'vitest'
import { mischtemperatur } from './mischtemperatur'

describe('Mischtemperatur', () => {
  it('reproduziert das hinterlegte Beispiel (gewichteter Mittelwert 40°C)', () => {
    const { bekannt, ziel, erwartet } = mischtemperatur.beispiel
    const ergebnis = mischtemperatur.compute(bekannt, ziel)
    expect(ergebnis.TM).toBeCloseTo(erwartet.TM, 2)
    expect(ergebnis.TM - 273.15).toBeCloseTo(40, 1)
  })

  it('Handrechnung: gleiche Massen, gleiches c -> arithmetisches Mittel (unabhängig vom Beispiel)', () => {
    // 10kg@c=2000@30°C=303,15K, 10kg@c=2000@10°C=283,15K -> TM = Mittel = 293,15K = 20°C
    const mc1 = 10 * 2000
    const mc2 = 10 * 2000
    const ergebnis = mischtemperatur.compute(
      { summeMC: mc1 + mc2, summeMCT: mc1 * 303.15 + mc2 * 283.15 },
      'TM',
    )
    expect(ergebnis.TM).toBeCloseTo(293.15, 6)
  })

  it('wirft Fehler bei Summe Masse·Wärmekapazität <= 0', () => {
    expect(() => mischtemperatur.compute({ summeMC: 0, summeMCT: 0 }, 'TM')).toThrow()
  })

  it('hat ein komponentenfeld mit drei Spalten (m, c, T)', () => {
    expect(mischtemperatur.komponentenfeld?.spalten.map((s) => s.id)).toEqual(['m', 'c', 'T'])
  })
})
