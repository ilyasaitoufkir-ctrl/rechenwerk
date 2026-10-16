import { describe, it, expect } from 'vitest'
import {
  berechneKennwerte,
  tQuantil,
  tCDF,
  lineareRegression,
  quadratischeRegression,
  vertrauensbereichMittelwert,
  parseMessreihe,
} from './statistik'

describe('Kennwerte einer Messreihe', () => {
  it('2,4,4,4,5,5,7,9 -> Mittelwert 5, Stichproben-Stabw ≈ 2,138', () => {
    const k = berechneKennwerte([2, 4, 4, 4, 5, 5, 7, 9])
    expect(k.mittelwert).toBeCloseTo(5, 9)
    expect(k.stabw).toBeCloseTo(2.138, 3)
    expect(k.n).toBe(8)
    expect(k.min).toBe(2)
    expect(k.max).toBe(9)
    expect(k.spannweite).toBe(7)
  })

  it('Handrechnung: 1,2,3 -> Mittelwert=2, Median=2, Stabw=1 (unabhängig)', () => {
    const k = berechneKennwerte([1, 2, 3])
    expect(k.mittelwert).toBeCloseTo(2, 9)
    expect(k.median).toBeCloseTo(2, 9)
    expect(k.stabw).toBeCloseTo(1, 9)
  })

  it('gerade Anzahl: Median ist Mittel der beiden mittleren Werte', () => {
    const k = berechneKennwerte([1, 2, 3, 4])
    expect(k.median).toBeCloseTo(2.5, 9)
  })

  it('wirft Fehler bei leerer Messreihe', () => {
    expect(() => berechneKennwerte([])).toThrow()
  })
})

describe('t-Verteilung', () => {
  it('t(0,975; 4) ≈ 2,776', () => {
    expect(tQuantil(0.975, 4)).toBeCloseTo(2.776, 2)
  })

  it('t(0,975; 10) ≈ 2,228', () => {
    expect(tQuantil(0.975, 10)).toBeCloseTo(2.228, 2)
  })

  it('bekannte Referenzwerte: t(0,95;1)≈6,314, t(0,995;30)≈2,750 (unabhängig)', () => {
    expect(tQuantil(0.95, 1)).toBeCloseTo(6.314, 2)
    expect(tQuantil(0.995, 30)).toBeCloseTo(2.75, 2)
  })

  it('t-Verteilung konvergiert für große df gegen die Normalverteilung (±1,96 bei 97,5%)', () => {
    expect(tQuantil(0.975, 100000)).toBeCloseTo(1.96, 2)
  })

  it('tCDF und tQuantil sind zueinander invers', () => {
    const t = tQuantil(0.9, 15)
    expect(tCDF(t, 15)).toBeCloseTo(0.9, 6)
  })

  it('Symmetrie: tCDF(0,df) = 0,5', () => {
    expect(tCDF(0, 8)).toBeCloseTo(0.5, 9)
  })
})

describe('Vertrauensbereich des Mittelwerts', () => {
  it('95%-Intervall für 2,4,4,4,5,5,7,9 enthält den Mittelwert symmetrisch', () => {
    const vb = vertrauensbereichMittelwert([2, 4, 4, 4, 5, 5, 7, 9], 0.95)
    expect(vb.mittelwert).toBeCloseTo(5, 9)
    expect(vb.untergrenze).toBeCloseTo(5 - vb.halbbreite, 9)
    expect(vb.obergrenze).toBeCloseTo(5 + vb.halbbreite, 9)
  })

  it('wirft Fehler bei weniger als 2 Werten', () => {
    expect(() => vertrauensbereichMittelwert([5], 0.95)).toThrow()
  })
})

describe('Lineare Regression (Anscombe-Quartett, Datensatz I)', () => {
  const x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5]
  const y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68]

  it('Steigung ≈ 0,500, Achsenabschnitt ≈ 3,00, R² ≈ 0,667', () => {
    const r = lineareRegression(x, y)
    expect(r.steigung).toBeCloseTo(0.5, 2)
    expect(r.achsenabschnitt).toBeCloseTo(3.0, 2)
    expect(r.r2).toBeCloseTo(0.667, 2)
    expect(r.residuen.length).toBe(x.length)
  })

  it('Handrechnung: perfekte Gerade y=2x+1 ergibt Steigung=2, Achsenabschnitt=1, R²=1 (unabhängig)', () => {
    const r = lineareRegression([0, 1, 2, 3], [1, 3, 5, 7])
    expect(r.steigung).toBeCloseTo(2, 9)
    expect(r.achsenabschnitt).toBeCloseTo(1, 9)
    expect(r.r2).toBeCloseTo(1, 9)
    expect(r.residuen.every((res) => Math.abs(res) < 1e-9)).toBe(true)
  })

  it('wirft Fehler, wenn alle x-Werte identisch sind', () => {
    expect(() => lineareRegression([5, 5, 5], [1, 2, 3])).toThrow()
  })
})

describe('Quadratische Regression', () => {
  it('rekonstruiert eine exakte Parabel y=1+2x+3x² (unabhängig nachgerechnet)', () => {
    const x = [0, 1, 2, 3, 4]
    const y = x.map((xi) => 1 + 2 * xi + 3 * xi * xi)
    const r = quadratischeRegression(x, y)
    expect(r.a).toBeCloseTo(1, 6)
    expect(r.b).toBeCloseTo(2, 6)
    expect(r.c).toBeCloseTo(3, 6)
  })

  it('wirft Fehler bei weniger als 3 Punkten', () => {
    expect(() => quadratischeRegression([1, 2], [1, 2])).toThrow()
  })

  it('wirft Fehler, wenn alle x-Werte identisch sind', () => {
    expect(() => quadratischeRegression([5, 5, 5], [1, 2, 3])).toThrow()
  })
})

describe('parseMessreihe (Einfügen aus Excel)', () => {
  it('parst Tab-getrennte Werte mit deutschem Komma', () => {
    expect(parseMessreihe('1,5\t2,3\t3,7')).toEqual([1.5, 2.3, 3.7])
  })

  it('parst Zeilenumbruch- und Semikolon-getrennte Werte', () => {
    expect(parseMessreihe('1,5\n2,3;3,7')).toEqual([1.5, 2.3, 3.7])
  })

  it('parst Werte mit Tausenderpunkt und Dezimalkomma', () => {
    expect(parseMessreihe('1.234,5')).toEqual([1234.5])
  })

  it('ignoriert nicht-numerische Einträge', () => {
    expect(parseMessreihe('1,5\tabc\t2,3')).toEqual([1.5, 2.3])
  })
})
