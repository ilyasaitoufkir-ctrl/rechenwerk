import { describe, it, expect } from 'vitest'
import { gleichgewichtskurve } from './gleichgewichtskurve'

describe('Gleichgewichtskurve', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = gleichgewichtskurve.beispiel
    const ergebnis = gleichgewichtskurve.compute(bekannt, ziel)
    expect(ergebnis.y).toBeCloseTo(erwartet.y, 5)
  })

  it('Handrechnung: löst nach α auf (unabhängig vom Beispiel)', () => {
    // Aus dem Beispiel bekannt: α=2 ergibt bei x=0,3 y=0,461538 - Rückrechnung muss α=2 treffen
    const ergebnis = gleichgewichtskurve.compute({ x: 0.3, y: 0.461538 }, 'alpha')
    expect(ergebnis.alpha).toBeCloseTo(2, 4)
  })

  it('löst auch nach x auf', () => {
    const ergebnis = gleichgewichtskurve.compute({ alpha: 2, y: 0.461538 }, 'x')
    expect(ergebnis.x).toBeCloseTo(0.3, 4)
  })

  it('wirft Fehler bei x oder y außerhalb [0,1] bei Zielgröße alpha', () => {
    expect(() => gleichgewichtskurve.compute({ x: 1.5, y: 0.5 }, 'alpha')).toThrow()
  })
})
