import { describe, it, expect } from 'vitest'
import { fenskeMindeststufenzahl } from './fenske-mindeststufenzahl'

describe('Fenske-Mindeststufenzahl (Formel)', () => {
  it('α=2,5, xD=0,95, xB=0,05 ergibt Nmin ≈ 6,43', () => {
    const ergebnis = fenskeMindeststufenzahl.compute({ alpha: 2.5, xD: 0.95, xB: 0.05 }, 'Nmin')
    expect(ergebnis.Nmin).toBeCloseTo(6.43, 1)
  })

  it('Handrechnung: α=3, xD=0,9, xB=0,1 (unabhängig vom Beispiel)', () => {
    // Nmin = ln[(0,9/0,1)*(0,9/0,1)]/ln(3) = ln(81)/ln(3) = 4,394449/1,098612 = 4
    const ergebnis = fenskeMindeststufenzahl.compute({ alpha: 3, xD: 0.9, xB: 0.1 }, 'Nmin')
    expect(ergebnis.Nmin).toBeCloseTo(4, 6)
  })
})
