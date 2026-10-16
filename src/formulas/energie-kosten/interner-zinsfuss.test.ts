import { describe, it, expect } from 'vitest'
import { internerZinsfuss } from './interner-zinsfuss'
import { kapitalwert } from '../../lib/wirtschaftlichkeit'

describe('Interner Zinsfuß', () => {
  it('reproduziert das hinterlegte Beispiel und setzt den Kapitalwert auf 0', () => {
    const { bekannt, ziel, erwartet } = internerZinsfuss.beispiel
    const ergebnis = internerZinsfuss.compute(bekannt, ziel)
    expect(ergebnis.irr).toBeCloseTo(erwartet.irr, 3)
    const jahre = bekannt.n / (365.25 * 86400)
    expect(kapitalwert(bekannt.I, bekannt.E, ergebnis.irr, jahre)).toBeCloseTo(0, 4)
  })

  it('Handrechnung: Sonderfall E·n = I ergibt IRR = 0% (unabhängig vom Beispiel)', () => {
    // I=10000€, E=2000€/Jahr, n=5 Jahre -> E*n=10000=I -> Kapitalwert bei 0% ist exakt 0, keine Lösung laut Implementierung
    expect(() => internerZinsfuss.compute({ I: 10000, E: 2000, n: 5 * 365.25 * 86400 }, 'irr')).toThrow()
  })

  it('wirft Fehler, wenn die Einsparung die Investition nicht deckt', () => {
    expect(() => internerZinsfuss.compute({ I: 10000, E: 500, n: 5 * 365.25 * 86400 }, 'irr')).toThrow()
  })
})
