import { describe, it, expect } from 'vitest'
import { grundlastquote } from './grundlastquote'

describe('Grundlastquote', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = grundlastquote.beispiel
    const ergebnis = grundlastquote.compute(bekannt, ziel)
    expect(ergebnis.quote).toBeCloseTo(erwartet.quote, 9)
  })

  it('Handrechnung: 15000 kWh von 60000 kWh (unabhängig vom Beispiel)', () => {
    const ergebnis = grundlastquote.compute({ eGrundlast: 15000 * 3.6e6, eGesamt: 60000 * 3.6e6 }, 'quote')
    expect(ergebnis.quote).toBeCloseTo(0.25, 9)
  })

  it('wirft Fehler bei Gesamtverbrauch <= 0', () => {
    expect(() => grundlastquote.compute({ eGrundlast: 100, eGesamt: 0 }, 'quote')).toThrow()
  })

  it('warnt, wenn die Quote über 100% liegt', () => {
    const warnungen = grundlastquote.warnungen?.({}, 'quote', { quote: 1.2 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
