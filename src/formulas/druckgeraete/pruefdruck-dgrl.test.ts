import { describe, it, expect } from 'vitest'
import { pruefdruckDgrl } from './pruefdruck-dgrl'

describe('Prüfdruck (DGRL 2014/68/EU)', () => {
  it('reproduziert das hinterlegte Beispiel: fa/ft=1 ergibt 1,43·PS', () => {
    const { bekannt, ziel, erwartet } = pruefdruckDgrl.beispiel
    const ergebnis = pruefdruckDgrl.compute(bekannt, ziel)
    expect(ergebnis.PT).toBeCloseTo(erwartet.PT, 0)
    expect(ergebnis.PT / bekannt.PS).toBeCloseTo(1.43, 6)
  })

  it('Handrechnung: fa/ft=1,3 (unabhängig) -> 1,25·PS·1,3 dominiert', () => {
    // PS=16 bar, fa/ft=1,3 -> max(1,25*16*1,3; 1,43*16) = max(26; 22,88) = 26 bar
    const ergebnis = pruefdruckDgrl.compute({ PS: 1.6e6, fa: 1.3, ft: 1 }, 'PT')
    expect(ergebnis.PT / 1e5).toBeCloseTo(26, 6)
  })

  it('wirft Fehler bei f_t <= 0', () => {
    expect(() => pruefdruckDgrl.compute({ PS: 1e6, fa: 1e8, ft: 0 }, 'PT')).toThrow()
  })
})
