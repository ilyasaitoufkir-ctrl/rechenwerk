import { describe, it, expect } from 'vitest'
import { logMittlereTemperaturdifferenz } from './log-mittlere-temperaturdifferenz'

describe('Mittlere logarithmische Temperaturdifferenz', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = logMittlereTemperaturdifferenz.beispiel
    const ergebnis = logMittlereTemperaturdifferenz.compute(bekannt, ziel)
    expect(ergebnis.dTm).toBeCloseTo(erwartet.dTm, 5)
  })

  it('Handrechnung: ΔTgr=50, ΔTkl=10 (unabhängig vom Beispiel)', () => {
    // ΔTm = (50-10)/ln(50/10) = 40/ln5 = 40/1,6094379 = 24,853397 K
    const ergebnis = logMittlereTemperaturdifferenz.compute({ dTgr: 50, dTkl: 10 }, 'dTm')
    expect(ergebnis.dTm).toBeCloseTo(24.853397, 5)
  })

  it('Grenzfall ΔTgr = ΔTkl ergibt ΔTm = ΔT (kein 0/0)', () => {
    const ergebnis = logMittlereTemperaturdifferenz.compute({ dTgr: 15, dTkl: 15 }, 'dTm')
    expect(ergebnis.dTm).toBeCloseTo(15, 9)
    expect(Number.isFinite(ergebnis.dTm)).toBe(true)
  })

  it('wirft Fehler bei negativer oder 0 Temperaturdifferenz', () => {
    expect(() => logMittlereTemperaturdifferenz.compute({ dTgr: 0, dTkl: 10 }, 'dTm')).toThrow()
    expect(() => logMittlereTemperaturdifferenz.compute({ dTgr: 10, dTkl: -5 }, 'dTm')).toThrow()
  })
})
