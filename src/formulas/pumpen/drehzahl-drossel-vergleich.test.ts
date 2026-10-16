import { describe, it, expect } from 'vitest'
import { drehzahlDrosselVergleich } from './drehzahl-drossel-vergleich'

describe('Drosselregelung gegen Drehzahlregelung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = drehzahlDrosselVergleich.beispiel
    const ergebnis = drehzahlDrosselVergleich.compute(bekannt, ziel)
    expect(ergebnis.einsparungEuroJahr).toBeCloseTo(erwartet.einsparungEuroJahr, 1)
    expect(ergebnis.pDrehzahl2).toBeCloseTo(erwartet.pDrehzahl2, 1)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // V1=0,04, P1=10000W, V2=0,02 (halber Volumenstrom) -> Verhältnis=0,5
    // PDrehzahl2 = 10000*0,5³ = 1250 W, PDrossel2=10000 (angenommen)
    // Einsparung = (10000-1250)/1000 * 2000h * 0,15€/kWh = 2625 €
    const ergebnis = drehzahlDrosselVergleich.compute(
      { V1: 0.04, P1: 10000, V2: 0.02, betriebsstunden: 2000 * 3600, strompreis: 0.15 },
      'einsparungEuroJahr',
    )
    expect(ergebnis.pDrehzahl2).toBeCloseTo(1250, 6)
    expect(ergebnis.einsparungEuroJahr).toBeCloseTo(2625, 3)
  })

  it('warnt, wenn V2 größer als V1 ist', () => {
    const warnungen = drehzahlDrosselVergleich.warnungen?.({ V1: 10, V2: 15 } as Record<string, number>, '', {}) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
