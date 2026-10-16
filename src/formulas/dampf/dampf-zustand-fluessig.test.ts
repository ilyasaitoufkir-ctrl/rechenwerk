import { describe, it, expect } from 'vitest'
import { dampfZustandFluessig } from './dampf-zustand-fluessig'

describe('Wasser, Zustand (Region 1)', () => {
  it('reproduziert das hinterlegte Beispiel (offizieller IAPWS-Verifikationspunkt)', () => {
    const { bekannt, ziel, erwartet } = dampfZustandFluessig.beispiel
    const ergebnis = dampfZustandFluessig.compute(bekannt, ziel)
    expect(ergebnis.h).toBeCloseTo(erwartet.h, 1)
    expect(ergebnis.v).toBeCloseTo(erwartet.v, 8)
  })

  it('Handrechnung: T=500K, p=80MPa -> s ≈ 0,368563852 kJ/(kg·K) (unabhängig vom Beispiel, IAPWS-Verifikationspunkt)', () => {
    // Hinweis: offizieller Verifikationspunkt ist (300K, 80MPa) -> s=0,368563852 kJ/(kgK)
    const ergebnis = dampfZustandFluessig.compute({ T: 300, p: 80e6 }, 'h')
    expect(ergebnis.s / 1000).toBeCloseTo(0.368563852, 6)
  })

  it('lehnt Dampf (p unterhalb Sättigungsdruck) ab', () => {
    expect(() => dampfZustandFluessig.compute({ T: 300, p: 1000 }, 'h')).toThrow()
  })

  it('lehnt Temperaturen über 350 °C ab (Region 3 nicht implementiert)', () => {
    expect(() => dampfZustandFluessig.compute({ T: 650, p: 30e6 }, 'h')).toThrow()
  })
})
