import { describe, it, expect } from 'vitest'
import { mischungMassenbilanz } from './mischung-massenbilanz'

describe('Mischung, Massenbilanz', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = mischungMassenbilanz.beispiel
    const ergebnis = mischungMassenbilanz.compute(bekannt, ziel)
    expect(ergebnis.wMix).toBeCloseTo(erwartet.wMix, 9)
  })

  it('Handrechnung: drei Komponenten (unabhängig vom Beispiel)', () => {
    // 50kg@0,05 + 30kg@0,20 + 20kg@0,50 -> Σm=100, Σmw=2,5+6+10=18,5 -> wMix=0,185
    const summeM = 50 + 30 + 20
    const summeMW = 50 * 0.05 + 30 * 0.2 + 20 * 0.5
    const ergebnis = mischungMassenbilanz.compute({ summeM, summeMW }, 'wMix')
    expect(ergebnis.wMix).toBeCloseTo(0.185, 9)
  })

  it('wirft Fehler bei Summe der Massen <= 0', () => {
    expect(() => mischungMassenbilanz.compute({ summeM: 0, summeMW: 0 }, 'wMix')).toThrow()
  })

  it('hat ein komponentenfeld mit den erwarteten Spalten und Summen', () => {
    expect(mischungMassenbilanz.komponentenfeld?.spalten.map((s) => s.id)).toEqual(['m', 'w'])
    expect(mischungMassenbilanz.komponentenfeld?.summen.map((s) => s.zielVariable)).toEqual(['summeM', 'summeMW'])
  })
})
