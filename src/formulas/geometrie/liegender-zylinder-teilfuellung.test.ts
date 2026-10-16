import { describe, it, expect } from 'vitest'
import { liegenderZylinderTeilfuellung } from './liegender-zylinder-teilfuellung'

describe('Liegender Zylinder, Teilfüllung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = liegenderZylinderTeilfuellung.beispiel
    const ergebnis = liegenderZylinderTeilfuellung.compute(bekannt, ziel)
    expect(ergebnis.V).toBeCloseTo(erwartet.V, 5)
  })

  it('h = R ergibt halbes Volumen', () => {
    const R = 0.5
    const L = 2
    const ergebnis = liegenderZylinderTeilfuellung.compute({ R, L, h: R }, 'V')
    expect(ergebnis.V).toBeCloseTo((Math.PI * R * R * L) / 2, 9)
  })

  it('h = 2R ergibt das volle Volumen', () => {
    const R = 0.5
    const L = 2
    const ergebnis = liegenderZylinderTeilfuellung.compute({ R, L, h: 2 * R }, 'V')
    expect(ergebnis.V).toBeCloseTo(Math.PI * R * R * L, 9)
  })

  it('h = 0 ergibt Volumen 0', () => {
    const ergebnis = liegenderZylinderTeilfuellung.compute({ R: 0.5, L: 2, h: 0 }, 'V')
    expect(ergebnis.V).toBeCloseTo(0, 9)
  })

  it('Rückrechnung Volumen zu Füllstand trifft den Ausgangswert', () => {
    const R = 0.6
    const L = 3
    const h0 = 0.37
    const v = liegenderZylinderTeilfuellung.compute({ R, L, h: h0 }, 'V')
    const h1 = liegenderZylinderTeilfuellung.compute({ R, L, V: v.V }, 'h')
    expect(h1.h).toBeCloseTo(h0, 4)
  })

  it('wirft Fehler bei Füllhöhe außerhalb [0, 2R]', () => {
    expect(() => liegenderZylinderTeilfuellung.compute({ R: 0.5, L: 1, h: 1.5 }, 'V')).toThrow()
  })
})
