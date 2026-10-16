import { describe, it, expect } from 'vitest'
import { stehenderZylinderFuellstand } from './stehender-zylinder-fuellstand'

describe('Stehender Zylinder, Füllstand', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = stehenderZylinderFuellstand.beispiel
    const ergebnis = stehenderZylinderFuellstand.compute(bekannt, ziel)
    expect(ergebnis.V).toBeCloseTo(erwartet.V, 5)
    expect(ergebnis.fuellstand).toBeCloseTo(erwartet.fuellstand, 6)
  })

  it('Handrechnung: löst nach h aus V auf (unabhängig vom Beispiel)', () => {
    // d=2m, Hges=3m, V=1 m³ -> Fläche=π*1=3,14159, h=1/3,14159=0,31831m, Füllstand=0,31831/3=0,106103 (=10,61%)
    const ergebnis = stehenderZylinderFuellstand.compute({ d: 2, Hges: 3, V: 1 }, 'h')
    expect(ergebnis.h).toBeCloseTo(0.31831, 4)
    expect(ergebnis.fuellstand).toBeCloseTo(0.106103, 4)
  })

  it('wirft Fehler, wenn das Volumen das Fassungsvermögen übersteigt', () => {
    expect(() => stehenderZylinderFuellstand.compute({ d: 1, Hges: 1, V: 10 }, 'h')).toThrow()
  })
})
