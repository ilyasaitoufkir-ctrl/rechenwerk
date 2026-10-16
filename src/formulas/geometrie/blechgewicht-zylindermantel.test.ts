import { describe, it, expect } from 'vitest'
import { blechgewichtZylindermantel } from './blechgewicht-zylindermantel'

describe('Blechgewicht Zylindermantel', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = blechgewichtZylindermantel.beispiel
    const ergebnis = blechgewichtZylindermantel.compute(bekannt, ziel)
    expect(ergebnis.m).toBeCloseTo(erwartet.m, 3)
  })

  it('Handrechnung: PE-Mantel (unabhängig vom Beispiel)', () => {
    // d=0,6m, h=1m, s=0,004m, ρ=950 -> m=950*π*0,6*1*0,004=7,1628 kg
    const ergebnis = blechgewichtZylindermantel.compute({ d: 0.6, h: 1, s: 0.004, rho: 950 }, 'm')
    expect(ergebnis.m).toBeCloseTo(7.1628, 3)
  })
})
