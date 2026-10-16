import { describe, it, expect } from 'vitest'
import { verduennung } from './verduennung'

describe('Verdünnung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = verduennung.beispiel
    const ergebnis = verduennung.compute(bekannt, ziel)
    expect(ergebnis.V2).toBeCloseTo(erwartet.V2, 9)
  })

  it('Handrechnung: löst nach c1 auf (unabhängig vom Beispiel)', () => {
    // c2=0,05, V2=200ml=2e-4, V1=10ml=1e-5 -> c1 = c2*V2/V1 = 0,05*2e-4/1e-5 = 1,0 (100%)
    const ergebnis = verduennung.compute({ c2: 0.05, V2: 2e-4, V1: 1e-5 }, 'c1')
    expect(ergebnis.c1).toBeCloseTo(1.0, 9)
  })

  it('warnt, wenn das Zielvolumen kleiner als das Ausgangsvolumen ist', () => {
    const warnungen = verduennung.warnungen?.({ V1: 100 } as Record<string, number>, 'V2', { V2: 50 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })

  it('wirft Fehler bei Division durch 0', () => {
    expect(() => verduennung.compute({ c1: 1, V1: 10, c2: 0 }, 'V2')).toThrow()
  })
})
