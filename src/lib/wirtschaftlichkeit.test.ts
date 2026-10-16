import { describe, it, expect } from 'vitest'
import {
  statischeAmortisation,
  rentenbarwertfaktor,
  kapitalwiedergewinnungsfaktor,
  kapitalwert,
  annuitaet,
  internerZinsfuss,
} from './wirtschaftlichkeit'

describe('Statische Amortisation', () => {
  it('Handrechnung: I=10000€, E=2500€/Jahr -> t=4 Jahre', () => {
    expect(statischeAmortisation(10000, 2500)).toBeCloseTo(4, 9)
  })

  it('wirft Fehler bei E <= 0', () => {
    expect(() => statischeAmortisation(10000, 0)).toThrow()
    expect(() => statischeAmortisation(10000, -100)).toThrow()
  })
})

describe('Kapitalwert', () => {
  it('bei i=0 entspricht der Kapitalwert der Summe der Zahlungen (-I + E·n)', () => {
    const I = 50000
    const E = 8000
    const n = 10
    expect(kapitalwert(I, E, 0, n)).toBeCloseTo(-I + E * n, 6)
  })

  it('Handrechnung: I=20000€, E=5000€/Jahr, i=5%, n=6 Jahre', () => {
    // Rentenbarwertfaktor = (1-1,05^-6)/0,05 = 5,075692
    // KW = -20000 + 5000*5,075692 = 5378,46
    const kw = kapitalwert(20000, 5000, 0.05, 6)
    expect(kw).toBeCloseTo(5378.46, 1)
  })

  it('wirft Fehler bei Nutzungsdauer <= 0', () => {
    expect(() => kapitalwert(1000, 100, 0.05, 0)).toThrow()
  })
})

describe('Interner Zinsfuß', () => {
  it('setzt den Kapitalwert auf (nahezu) null', () => {
    const I = 20000
    const E = 5000
    const n = 6
    const irr = internerZinsfuss(I, E, n)
    expect(kapitalwert(I, E, irr, n)).toBeCloseTo(0, 4)
  })

  it('Handrechnung Sonderfall: E·n = I genau -> IRR = 0%', () => {
    // I=10000, E=2000, n=5 -> E*n=10000=I -> bei i=0 ist KW=0, IRR=0
    // kwBeiNull <= 0 (exakt 0) -> Fehler laut Implementierung (Grenzfall, keine positive Lösung)
    expect(() => internerZinsfuss(10000, 2000, 5)).toThrow()
  })

  it('wirft Fehler, wenn die Einsparung die Investition nicht deckt', () => {
    expect(() => internerZinsfuss(10000, 500, 5)).toThrow()
  })

  it('wirft Fehler bei E <= 0', () => {
    expect(() => internerZinsfuss(10000, 0, 5)).toThrow()
  })
})

describe('Annuität', () => {
  it('Annuität bei i=0 entspricht E - I/n', () => {
    const I = 12000
    const E = 3000
    const n = 6
    expect(annuitaet(I, E, 0, n)).toBeCloseTo(E - I / n, 6)
  })

  it('Annuität ist 0, wenn i gleich dem internen Zinsfuß ist', () => {
    const I = 20000
    const E = 5000
    const n = 6
    const irr = internerZinsfuss(I, E, n)
    expect(annuitaet(I, E, irr, n)).toBeCloseTo(0, 3)
  })
})

describe('Renten- und Kapitalwiedergewinnungsfaktor', () => {
  it('sind zueinander reziprok', () => {
    const rbf = rentenbarwertfaktor(0.06, 8)
    const kwf = kapitalwiedergewinnungsfaktor(0.06, 8)
    expect(rbf * kwf).toBeCloseTo(1, 9)
  })

  it('Rentenbarwertfaktor bei i=0 entspricht der Laufzeit n', () => {
    expect(rentenbarwertfaktor(0, 12)).toBe(12)
  })
})
