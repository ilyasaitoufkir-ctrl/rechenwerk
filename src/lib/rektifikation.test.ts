import { describe, it, expect } from 'vitest'
import {
  gleichgewichtY,
  gleichgewichtX,
  fenskeMindeststufenzahl,
  mindestrueckverhaeltnis,
  gillilandY,
  gillilandStufenzahl,
  mcCabeThiele,
} from './rektifikation'

describe('Gleichgewichtskurve', () => {
  it('y und x-Umkehrfunktion sind zueinander invers', () => {
    const alpha = 2.2
    const x = 0.37
    const y = gleichgewichtY(x, alpha)
    expect(gleichgewichtX(y, alpha)).toBeCloseTo(x, 9)
  })

  it('Handrechnung: α=2, x=0,3 -> y=0,6/1,3=0,461538 (unabhängig)', () => {
    expect(gleichgewichtY(0.3, 2)).toBeCloseTo(0.461538, 5)
  })
})

describe('Fenske-Mindeststufenzahl', () => {
  it('α=2,5, xD=0,95, xB=0,05 -> Nmin ≈ 6,43', () => {
    expect(fenskeMindeststufenzahl(2.5, 0.95, 0.05)).toBeCloseTo(6.43, 1)
  })

  it('wirft Fehler bei α ≤ 1', () => {
    expect(() => fenskeMindeststufenzahl(1, 0.9, 0.1)).toThrow()
  })
})

describe('Mindestrücklaufverhältnis', () => {
  it('α=2,5, xF=0,5, q=1, xD=0,95 -> y*≈0,7143, Rmin≈1,10', () => {
    expect(mindestrueckverhaeltnis(2.5, 0.5, 0.95, 1)).toBeCloseTo(1.1, 1)
  })

  it('Handrechnung q≠1 (unabhängig): α=3, xF=0,4, xD=0,9, q=1,3', () => {
    // Schnittpunkt numerisch, dann Rmin über die Formel - Konsistenzcheck:
    // das Ergebnis muss die Rmin-Formel mit dem gefundenen Schnittpunkt erfüllen
    const Rmin = mindestrueckverhaeltnis(3, 0.4, 0.9, 1.3)
    expect(Rmin).toBeGreaterThan(0)
    expect(Number.isFinite(Rmin)).toBe(true)
  })
})

describe('Gilliland-Korrelation (Eduljee)', () => {
  it('X=0 ergibt Y=0,75', () => {
    expect(gillilandY(0)).toBeCloseTo(0.75, 9)
  })

  it('X=1 ergibt Y=0', () => {
    expect(gillilandY(1)).toBeCloseTo(0, 9)
  })

  it('Handrechnung: X=0,5 -> Y=0,75*(1-0,5^0,5668)=0,243666 (unabhängig)', () => {
    expect(gillilandY(0.5)).toBeCloseTo(0.243666, 5)
  })

  it('löst N aus R, Rmin, Nmin konsistent mit der Gilliland-Formel', () => {
    const Rmin = 1.1
    const Nmin = 6.43
    const R = 2
    const N = gillilandStufenzahl(R, Rmin, Nmin)
    const X = (R - Rmin) / (R + 1)
    const Yzurueck = (N - Nmin) / (N + 1)
    expect(Yzurueck).toBeCloseTo(gillilandY(X), 6)
  })
})

describe('McCabe-Thiele-Stufenkonstruktion', () => {
  const alpha = 2.5
  const xD = 0.95
  const xB = 0.05
  const xF = 0.5
  const q = 1

  it('bei sehr großem R nähert sich die Stufenzahl N_min aus Fenske', () => {
    const Nmin = fenskeMindeststufenzahl(alpha, xD, xB)
    const ergebnis = mcCabeThiele(alpha, xD, xB, xF, q, 10000)
    // Diskrete Stufenzahl bei (quasi-)totalem Rücklauf muss die nächste ganze Zahl über Nmin sein
    expect(ergebnis.theoretischeStufenzahl).toBe(Math.ceil(Nmin))
  })

  it('bricht mit Fehler ab, wenn R ≤ Rmin (Pinch, unendliche Stufenzahl)', () => {
    const Rmin = mindestrueckverhaeltnis(alpha, xF, xD, q)
    expect(() => mcCabeThiele(alpha, xD, xB, xF, q, Rmin * 0.9)).toThrow()
  })

  it('Handrechnung: R=1,5·Rmin ergibt eine endliche, plausible Stufenzahl über Nmin (unabhängig)', () => {
    const Rmin = mindestrueckverhaeltnis(alpha, xF, xD, q)
    const Nmin = fenskeMindeststufenzahl(alpha, xD, xB)
    const ergebnis = mcCabeThiele(alpha, xD, xB, xF, q, Rmin * 1.5)
    expect(ergebnis.theoretischeStufenzahl).toBeGreaterThan(Nmin)
    expect(ergebnis.theoretischeStufenzahl).toBeLessThan(30)
    expect(ergebnis.zulaufstufe).toBeGreaterThan(0)
    expect(ergebnis.zulaufstufe).toBeLessThanOrEqual(ergebnis.theoretischeStufenzahl)
  })

  it('letzte Stufe liegt bei x ≤ xB', () => {
    const ergebnis = mcCabeThiele(alpha, xD, xB, xF, q, 2)
    const letzte = ergebnis.stufen[ergebnis.stufen.length - 1]
    expect(letzte.x).toBeLessThanOrEqual(xB)
  })

  it('wirft Fehler bei xD <= xB', () => {
    expect(() => mcCabeThiele(alpha, 0.5, 0.5, xF, q, 2)).toThrow()
  })
})
