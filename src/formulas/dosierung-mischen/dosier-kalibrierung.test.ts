import { describe, it, expect } from 'vitest'
import { dosierKalibrierung } from './dosier-kalibrierung'

describe('Dosierkalibrierung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = dosierKalibrierung.beispiel
    const ergebnis = dosierKalibrierung.compute(bekannt, ziel)
    expect(ergebnis.abweichung).toBeCloseTo(erwartet.abweichung, 6)
    expect(ergebnis.korrekturfaktor).toBeCloseTo(erwartet.korrekturfaktor, 5)
  })

  it('Handrechnung: Unterdosierung (unabhängig vom Beispiel)', () => {
    // Soll=50 ml=5e-5, Ist=46 ml=4,6e-5, ρ=1200
    // Abw.=(46-50)/50=-0,08 (=-8%), fKorr=50/46=1,086957
    const ergebnis = dosierKalibrierung.compute({ sollVolumen: 5e-5, istVolumen: 4.6e-5, rho: 1200 }, 'abweichung')
    expect(ergebnis.abweichung).toBeCloseTo(-0.08, 6)
    expect(ergebnis.korrekturfaktor).toBeCloseTo(1.086957, 5)
  })

  it('wirft Fehler bei Istmenge 0', () => {
    expect(() => dosierKalibrierung.compute({ sollVolumen: 1e-4, istVolumen: 0, rho: 1000 }, 'abweichung')).toThrow()
  })
})
