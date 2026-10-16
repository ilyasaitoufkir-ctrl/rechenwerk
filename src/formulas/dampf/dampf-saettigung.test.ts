import { describe, it, expect } from 'vitest'
import { dampfSaettigung } from './dampf-saettigung'

describe('Sattdampftafel', () => {
  it('reproduziert das hinterlegte Beispiel (Plausibilitätstest bei Atmosphärendruck)', () => {
    const { bekannt, ziel, erwartet } = dampfSaettigung.beispiel
    const ergebnis = dampfSaettigung.compute(bekannt, ziel)
    expect(ergebnis.T - 273.15).toBeCloseTo(99.97, 1)
    expect(ergebnis.r).toBeCloseTo(erwartet.r, -2)
  })

  it('Handrechnung: T=453,15K (180°C) -> p_s ≈ 10,0 bar (unabhängig vom Beispiel, bekannter Dampftafel-Richtwert)', () => {
    // Gängiger Dampftafel-Richtwert: Sättigungsdruck bei 180 °C liegt nahe 10 bar
    const ergebnis = dampfSaettigung.compute({ T: 453.15 }, 'p')
    expect(ergebnis.p / 1e5).toBeCloseTo(10.0, 0)
  })

  it('h\'\' ist größer als h\' (Verdampfungsenthalpie positiv)', () => {
    const ergebnis = dampfSaettigung.compute({ T: 400 }, 'p')
    expect(ergebnis.hDampf).toBeGreaterThan(ergebnis.hFluessig)
    expect(ergebnis.r).toBeCloseTo(ergebnis.hDampf - ergebnis.hFluessig, 6)
  })

  it('lehnt Sättigungstemperatur über 350 °C ab (Region 3 nicht implementiert)', () => {
    expect(() => dampfSaettigung.compute({ T: 630 }, 'p')).toThrow()
  })

  it('löst auch nach T aus gegebenem Druck auf', () => {
    const ergebnis = dampfSaettigung.compute({ p: 1e6 }, 'T')
    expect(ergebnis.T).toBeGreaterThan(450)
    expect(ergebnis.T).toBeLessThan(460)
  })
})
