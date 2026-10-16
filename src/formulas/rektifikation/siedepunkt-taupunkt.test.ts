import { describe, it, expect } from 'vitest'
import { siedepunkt } from './siedepunkt'
import { taupunkt } from './taupunkt'

const ETHANOL = { A1: 8.20417, B1: 1642.89, C1: 230.3 }
const WASSER = { A2: 8.07131, B2: 1730.63, C2: 233.426 }

describe('Siedepunkt (Bubble Point)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = siedepunkt.beispiel
    const ergebnis = siedepunkt.compute(bekannt, ziel)
    expect(ergebnis.T).toBeCloseTo(erwartet.T, 3)
  })

  it('Handrechnung: reines Wasser (x1=0) siedet bei ≈100°C (unabhängig vom Beispiel)', () => {
    const ergebnis = siedepunkt.compute({ ...ETHANOL, ...WASSER, basis: 10, x1: 0, P: 760 }, 'T')
    expect(ergebnis.T).toBeCloseTo(100, 0)
  })
})

describe('Taupunkt (Dew Point)', () => {
  it('reproduziert das hinterlegte Beispiel (reines Ethanol, y1=1)', () => {
    const { bekannt, ziel, erwartet } = taupunkt.beispiel
    const ergebnis = taupunkt.compute(bekannt, ziel)
    expect(ergebnis.T).toBeCloseTo(erwartet.T, 3)
    expect(ergebnis.T).toBeCloseTo(78.3, 0)
  })

  it('Handrechnung: reines Wasser (y1=0) hat Taupunkt ≈100°C (unabhängig vom Beispiel)', () => {
    const ergebnis = taupunkt.compute({ ...ETHANOL, ...WASSER, basis: 10, y1: 0, P: 760 }, 'T')
    expect(ergebnis.T).toBeCloseTo(100, 0)
  })
})
