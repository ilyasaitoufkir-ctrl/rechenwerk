import { describe, it, expect } from 'vitest'
import { massenbilanzKolonne } from './massenbilanz-kolonne'

describe('Gesamt- und Komponentenbilanz Kolonne', () => {
  it('reproduziert das hinterlegte Beispiel, D+B=F geht exakt auf', () => {
    const { bekannt, ziel, erwartet } = massenbilanzKolonne.beispiel
    const ergebnis = massenbilanzKolonne.compute(bekannt, ziel)
    expect(ergebnis.D).toBeCloseTo(erwartet.D, 8)
    expect(ergebnis.B).toBeCloseTo(erwartet.B, 8)
    expect(ergebnis.D + ergebnis.B).toBeCloseTo(bekannt.F, 9)
  })

  it('Komponentenbilanz geht exakt auf: F·xF = D·xD + B·xB', () => {
    const { bekannt, ziel } = massenbilanzKolonne.beispiel
    const ergebnis = massenbilanzKolonne.compute(bekannt, ziel)
    expect(ergebnis.D * bekannt.xD + ergebnis.B * bekannt.xB).toBeCloseTo(bekannt.F * bekannt.xF, 6)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // F=50 kg/h, xF=0,3, xD=0,9, xB=0,05 -> D=50*(0,3-0,05)/(0,9-0,05)=50*0,25/0,85=14,70588
    const ergebnis = massenbilanzKolonne.compute({ F: 50, xF: 0.3, xD: 0.9, xB: 0.05 }, 'D')
    expect(ergebnis.D).toBeCloseTo(14.70588, 4)
    expect(ergebnis.B).toBeCloseTo(35.29412, 4)
  })

  it('wirft Fehler, wenn xF nicht zwischen xB und xD liegt', () => {
    expect(() => massenbilanzKolonne.compute({ F: 100, xF: 0.98, xD: 0.95, xB: 0.05 }, 'D')).toThrow()
  })
})
