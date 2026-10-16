import { describe, it, expect } from 'vitest'
import { volumenKegelstumpf } from './volumen-kegelstumpf'

describe('Volumen Kegelstumpf', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = volumenKegelstumpf.beispiel
    const ergebnis = volumenKegelstumpf.compute(bekannt, ziel)
    expect(ergebnis.V).toBeCloseTo(erwartet.V, 6)
  })

  it('r = R ergibt das Zylindervolumen', () => {
    const R = 0.5
    const h = 2
    const ergebnis = volumenKegelstumpf.compute({ R, r: R, h }, 'V')
    expect(ergebnis.V).toBeCloseTo(Math.PI * R * R * h, 9)
  })

  it('r = 0 ergibt das Kegelvolumen', () => {
    const R = 0.5
    const h = 1
    const ergebnis = volumenKegelstumpf.compute({ R, r: 0, h }, 'V')
    expect(ergebnis.V).toBeCloseTo((Math.PI * R * R * h) / 3, 9)
  })

  it('wirft Fehler bei negativem Radius', () => {
    expect(() => volumenKegelstumpf.compute({ R: -1, r: 0.5, h: 1 }, 'V')).toThrow()
  })
})
