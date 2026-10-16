import { describe, it, expect } from 'vitest'
import { blechgewichtKegelstumpfmantel } from './blechgewicht-kegelstumpfmantel'

describe('Blechgewicht Kegelstumpfmantel (Trichter)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = blechgewichtKegelstumpfmantel.beispiel
    const ergebnis = blechgewichtKegelstumpfmantel.compute(bekannt, ziel)
    expect(ergebnis.m).toBeCloseTo(erwartet.m, 3)
  })

  it('Anwendungsfall: Trichtergewicht Edelstahl gegen PP (unabhängig vom Beispiel)', () => {
    const geometrie = { R: 0.4, r: 0.05, h: 0.5, s: 0.004 }
    const edelstahl = blechgewichtKegelstumpfmantel.compute({ ...geometrie, rho: 7900 }, 'm')
    const pp = blechgewichtKegelstumpfmantel.compute({ ...geometrie, rho: 905 }, 'm')
    // PP ist bei gleicher Geometrie deutlich leichter als Edelstahl
    expect(pp.m).toBeLessThan(edelstahl.m)
    expect(edelstahl.m / pp.m).toBeCloseTo(7900 / 905, 6)
  })
})
