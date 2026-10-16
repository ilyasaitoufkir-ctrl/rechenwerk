import { describe, it, expect } from 'vitest'
import { dampfdruckAntoine } from './dampfdruck-antoine'

describe('Dampfdruck nach Antoine', () => {
  it('reproduziert das hinterlegte Beispiel (Wasser bei 100°C ≈ 760 mmHg)', () => {
    const { bekannt, ziel, erwartet } = dampfdruckAntoine.beispiel
    const ergebnis = dampfdruckAntoine.compute(bekannt, ziel)
    expect(ergebnis.p).toBeCloseTo(erwartet.p, 3)
  })

  it('Handrechnung: Ethanol bei 78,3°C ≈ 760 mmHg (unabhängig vom Beispiel)', () => {
    const ergebnis = dampfdruckAntoine.compute(
      { A: 8.20417, B: 1642.89, C: 230.3, T: 78.3, basis: 10 },
      'p',
    )
    expect(ergebnis.p).toBeCloseTo(760, -1)
  })

  it('funktioniert auch mit ln-Basis (e statt 10)', () => {
    // Für dieselben A,B,C in log10-Form entspricht die ln-Form A'=A*ln(10), B'=B*ln(10)
    const ln10 = Math.log(10)
    const ergebnisLog10 = dampfdruckAntoine.compute({ A: 8.07131, B: 1730.63, C: 233.426, T: 100, basis: 10 }, 'p')
    const ergebnisLn = dampfdruckAntoine.compute(
      { A: 8.07131 * ln10, B: 1730.63 * ln10, C: 233.426, T: 100, basis: Math.E },
      'p',
    )
    expect(ergebnisLn.p).toBeCloseTo(ergebnisLog10.p, 6)
  })
})
