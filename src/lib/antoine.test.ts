import { describe, it, expect } from 'vitest'
import { antoinePsat, siedepunkt, taupunkt } from './antoine'

// Klassische Lehrbuch-Antoine-Koeffizienten (log10, p in mmHg, T in °C)
const WASSER = { A: 8.07131, B: 1730.63, C: 233.426 }
const ETHANOL = { A: 8.20417, B: 1642.89, C: 230.3 }

describe('Antoine-Gleichung', () => {
  it('Wasser bei 100°C ergibt ≈760 mmHg (Siedepunkt bei Normaldruck)', () => {
    expect(antoinePsat(WASSER.A, WASSER.B, WASSER.C, 100, 10)).toBeCloseTo(760, -1)
  })

  it('Ethanol bei 78,3°C ergibt ≈760 mmHg (bekannter Siedepunkt)', () => {
    expect(antoinePsat(ETHANOL.A, ETHANOL.B, ETHANOL.C, 78.3, 10)).toBeCloseTo(760, -1)
  })

  it('Handrechnung: Wasser bei 50°C (unabhängig)', () => {
    // log10(p) = 8,07131 - 1730,63/(233,426+50) = 8,07131-6,10452=1,96679 -> p=92,62 mmHg
    const p = antoinePsat(WASSER.A, WASSER.B, WASSER.C, 50, 10)
    expect(p).toBeCloseTo(92.6, 0)
  })

  it('wirft Fehler bei Logarithmusbasis <= 1', () => {
    expect(() => antoinePsat(8, 1700, 230, 50, 1)).toThrow()
  })
})

describe('Siede- und Taupunkt (ideales binäres Gemisch)', () => {
  it('reine Komponente 1 (x1=1) ergibt deren Siedepunkt', () => {
    const t = siedepunkt(ETHANOL, WASSER, 10, 1, 760)
    expect(t).toBeCloseTo(78.3, 0)
  })

  it('reine Komponente 2 (x1=0) ergibt deren Siedepunkt', () => {
    const t = siedepunkt(ETHANOL, WASSER, 10, 0, 760)
    expect(t).toBeCloseTo(100, 0)
  })

  it('Mischung siedet zwischen den beiden Reinstoff-Siedepunkten', () => {
    const t = siedepunkt(ETHANOL, WASSER, 10, 0.5, 760)
    expect(t).toBeGreaterThan(78.3)
    expect(t).toBeLessThan(100)
  })

  it('Taupunkt und Siedepunkt stimmen bei Reinstoffen überein', () => {
    const tSiede = siedepunkt(ETHANOL, WASSER, 10, 1, 760)
    const tTau = taupunkt(ETHANOL, WASSER, 10, 1, 760)
    expect(tTau).toBeCloseTo(tSiede, 3)
  })

  it('wirft Fehler bei x1 außerhalb [0,1]', () => {
    expect(() => siedepunkt(ETHANOL, WASSER, 10, 1.5, 760)).toThrow()
  })
})
