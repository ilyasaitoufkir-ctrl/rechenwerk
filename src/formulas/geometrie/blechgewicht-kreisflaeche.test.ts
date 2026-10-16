import { describe, it, expect } from 'vitest'
import { blechgewichtKreisflaeche } from './blechgewicht-kreisflaeche'

describe('Blechgewicht Kreisfläche', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = blechgewichtKreisflaeche.beispiel
    const ergebnis = blechgewichtKreisflaeche.compute(bekannt, ziel)
    expect(ergebnis.m).toBeCloseTo(erwartet.m, 3)
  })

  it('Handrechnung: PP-Deckel (unabhängig vom Beispiel)', () => {
    // d=0,5m, s=0,005m, ρ=905 -> m = 905*(π*0,25/4)*0,005 = 0,8884 kg
    const ergebnis = blechgewichtKreisflaeche.compute({ d: 0.5, s: 0.005, rho: 905 }, 'm')
    expect(ergebnis.m).toBeCloseTo(0.8884, 3)
  })
})
