import { describe, it, expect } from 'vitest'
import { reynolds } from './reynolds'

describe('Reynoldszahl', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = reynolds.beispiel
    const ergebnis = reynolds.compute(bekannt, ziel)
    expect(Math.abs(ergebnis.Re - erwartet.Re) / erwartet.Re).toBeLessThan(1e-4)
  })

  it('Handrechnung: v = 2 m/s, d = 0,02 m, ν = 1e-6 m²/s (unabhängig vom Beispiel)', () => {
    // Handrechnung: Re = v*d/ν = 2*0,02/1e-6 = 40000
    const ergebnis = reynolds.compute({ v: 2, d: 0.02, nu: 1e-6 }, 'Re')
    expect(ergebnis.Re).toBeCloseTo(40000, 6)
  })

  it('wirft Fehler bei ν <= 0', () => {
    expect(() => reynolds.compute({ v: 1, d: 0.1, nu: 0 }, 'Re')).toThrow()
    expect(() => reynolds.compute({ v: 1, d: 0.1, nu: -1 }, 'Re')).toThrow()
  })

  it('ordnet Randfälle korrekt ein: laminar, Übergang, turbulent', () => {
    expect(reynolds.warnungen?.({}, 'Re', { Re: 1000 })?.[0]).toMatch(/[Ll]aminar/)
    expect(reynolds.warnungen?.({}, 'Re', { Re: 3000 })?.[0]).toMatch(/Übergang/)
    expect(reynolds.warnungen?.({}, 'Re', { Re: 10000 })?.[0]).toMatch(/turbulent/i)
  })
})
