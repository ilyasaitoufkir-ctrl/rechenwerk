import { describe, it, expect } from 'vitest'
import { gillilandStufenzahl } from './gilliland-stufenzahl'

describe('Stufenzahl nach Gilliland (Eduljee)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = gillilandStufenzahl.beispiel
    const ergebnis = gillilandStufenzahl.compute(bekannt, ziel)
    expect(ergebnis.N).toBeCloseTo(erwartet.N, 3)
  })

  it('Handrechnung: R sehr groß nähert N an Nmin an (unabhängig vom Beispiel)', () => {
    const ergebnis = gillilandStufenzahl.compute({ R: 1000, Rmin: 1.1, Nmin: 6.426866 }, 'N')
    expect(ergebnis.N).toBeCloseTo(6.426866, 1)
  })

  it('ist als Richtwert markiert', () => {
    expect(gillilandStufenzahl.richtwert).toBe(true)
  })

  it('wirft Fehler, wenn R nicht größer als Rmin ist', () => {
    expect(() => gillilandStufenzahl.compute({ R: 1, Rmin: 1.1, Nmin: 6.4 }, 'N')).toThrow()
  })
})
