import { describe, it, expect } from 'vitest'
import { stromkosten } from './stromkosten'

describe('Stromkosten', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = stromkosten.beispiel
    const ergebnis = stromkosten.compute(bekannt, ziel)
    expect(ergebnis.kosten).toBeCloseTo(erwartet.kosten, 6)
  })

  it('Handrechnung mit Leistungspreis (unabhängig vom Beispiel)', () => {
    // Verbrauch=10000 kWh=3,6e10 J, Arbeitspreis=0,25€/kWh -> 2500€
    // Leistung=50 kW=50000 W, Leistungspreis=100€/kW -> 5000€
    // Summe = 7500 €
    const ergebnis = stromkosten.compute(
      { arbeitspreis: 0.25, verbrauch: 3.6e10, leistungspreis: 100, leistung: 50000 },
      'kosten',
    )
    expect(ergebnis.kosten).toBeCloseTo(7500, 6)
  })
})
