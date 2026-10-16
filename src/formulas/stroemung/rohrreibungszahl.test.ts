import { describe, it, expect } from 'vitest'
import { rohrreibungszahl } from './rohrreibungszahl'

describe('Rohrreibungszahl λ', () => {
  it('reproduziert das hinterlegte Beispiel (turbulent, nahezu glatt)', () => {
    const { bekannt, ziel, erwartet } = rohrreibungszahl.beispiel
    const ergebnis = rohrreibungszahl.compute(bekannt, ziel)
    expect(ergebnis.lambda).toBeCloseTo(erwartet.lambda, 3)
  })

  it('Handrechnung laminar: Re = 1500 (unabhängig vom Beispiel)', () => {
    // Handrechnung: λ = 64/Re = 64/1500 = 0,0426667
    const ergebnis = rohrreibungszahl.compute({ Re: 1500, k: 0.0001, d: 0.05 }, 'lambda')
    expect(ergebnis.lambda).toBeCloseTo(0.0426667, 6)
  })

  it('warnt im Übergangsbereich', () => {
    const warnungen = rohrreibungszahl.warnungen?.({ Re: 3000, k: 0.0001, d: 0.05 }, 'lambda', { lambda: 0 }) ?? []
    expect(warnungen.some((w) => w.includes('Übergangsbereich'))).toBe(true)
  })

  it('warnt, wenn Rauheit nicht kleiner als Durchmesser ist', () => {
    const warnungen = rohrreibungszahl.warnungen?.({ Re: 1e5, k: 0.2, d: 0.1 }, 'lambda', { lambda: 0 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })

  it('wirft Fehler bei Re <= 0 oder d <= 0', () => {
    expect(() => rohrreibungszahl.compute({ Re: 0, k: 0.001, d: 0.1 }, 'lambda')).toThrow()
    expect(() => rohrreibungszahl.compute({ Re: 1e5, k: 0.001, d: 0 }, 'lambda')).toThrow()
  })
})
