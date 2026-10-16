import { describe, it, expect } from 'vitest'
import { zylinderschaleEn13445 } from './zylinderschale-en13445'
import { kugelschaleEn13445 } from './kugelschale-en13445'

describe('Zylinderschale unter Innendruck (EN 13445-3)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = zylinderschaleEn13445.beispiel
    const ergebnis = zylinderschaleEn13445.compute(bekannt, ziel)
    expect(ergebnis.e).toBeCloseTo(erwartet.e, 6)
    expect(ergebnis.eBestell).toBeCloseTo(erwartet.eBestell, 6)
  })

  it('Handrechnung: P=1 MPa, Di=500mm, f=180 MPa, z=0,85 (unabhängig vom Beispiel)', () => {
    // e = 1e6*0,5/(2*1,8e8*0,85-1e6) = 500000/305000000 = 0,00163934 m = 1,63934 mm
    const ergebnis = zylinderschaleEn13445.compute({ P: 1e6, Di: 0.5, f: 1.8e8, z: 0.85, c1: 0, c2: 0 }, 'e')
    expect(ergebnis.e).toBeCloseTo(0.00163934, 7)
  })

  it('Rückwärtsrechnung trifft den Ausgangsdruck', () => {
    const { bekannt, ziel } = zylinderschaleEn13445.beispiel
    const vorwaerts = zylinderschaleEn13445.compute(bekannt, ziel)
    const { P, ...rest } = bekannt
    const rueckwaerts = zylinderschaleEn13445.compute({ ...rest, e: vorwaerts.e }, 'P')
    expect(rueckwaerts.P).toBeCloseTo(P, 4)
  })

  it('wirft Fehler, wenn P >= 2fz ist (keine endliche Wanddicke)', () => {
    expect(() => zylinderschaleEn13445.compute({ P: 5e8, Di: 1, f: 2e8, z: 1, c1: 0, c2: 0 }, 'e')).toThrow()
  })
})

describe('Kugelschale unter Innendruck (EN 13445-3)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = kugelschaleEn13445.beispiel
    const ergebnis = kugelschaleEn13445.compute(bekannt, ziel)
    expect(ergebnis.e).toBeCloseTo(erwartet.e, 6)
  })

  it('Handrechnung: gleiche Daten wie Zylinder-Handrechnung (unabhängig vom Beispiel)', () => {
    // e = 1e6*0,5/(4*1,8e8*0,85-1e6) = 500000/611000000 = 0,000818331 m
    const ergebnis = kugelschaleEn13445.compute({ P: 1e6, Di: 0.5, f: 1.8e8, z: 0.85, c1: 0, c2: 0 }, 'e')
    expect(ergebnis.e).toBeCloseTo(0.000818331, 8)
  })

  it('ergibt bei gleichen Daten etwa die halbe Wanddicke des Zylinders', () => {
    const daten = { P: 1.6e6, Di: 1, f: 2e8, z: 1, c1: 0, c2: 0 }
    const zyl = zylinderschaleEn13445.compute(daten, 'e')
    const kugel = kugelschaleEn13445.compute(daten, 'e')
    expect(zyl.e / kugel.e).toBeCloseTo(2, 2)
  })

  it('Rückwärtsrechnung trifft den Ausgangsdruck', () => {
    const { bekannt, ziel } = kugelschaleEn13445.beispiel
    const vorwaerts = kugelschaleEn13445.compute(bekannt, ziel)
    const { P, ...rest } = bekannt
    const rueckwaerts = kugelschaleEn13445.compute({ ...rest, e: vorwaerts.e }, 'P')
    expect(rueckwaerts.P).toBeCloseTo(P, 4)
  })

  it('wirft Fehler, wenn P >= 4fz ist', () => {
    expect(() => kugelschaleEn13445.compute({ P: 9e8, Di: 1, f: 2e8, z: 1, c1: 0, c2: 0 }, 'e')).toThrow()
  })
})
