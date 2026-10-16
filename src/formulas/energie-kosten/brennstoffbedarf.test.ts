import { describe, it, expect } from 'vitest'
import { brennstoffbedarf } from './brennstoffbedarf'

describe('Brennstoffbedarf aus Nutzwärme', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = brennstoffbedarf.beispiel
    const ergebnis = brennstoffbedarf.compute(bekannt, ziel)
    expect(ergebnis.Qbrennstoff).toBeCloseTo(erwartet.Qbrennstoff, -2)
  })

  it('Handrechnung: η aus Qnutz, Qbrennstoff (unabhängig vom Beispiel)', () => {
    // η = Qnutz/Qbrennstoff = 80/100 = 0,8
    const ergebnis = brennstoffbedarf.compute({ Qnutz: 8e10, Qbrennstoff: 1e11 }, 'eta')
    expect(ergebnis.eta).toBeCloseTo(0.8, 9)
  })

  it('wirft Fehler bei η <= 0', () => {
    expect(() => brennstoffbedarf.compute({ Qnutz: 1000, eta: 0 }, 'Qbrennstoff')).toThrow()
  })

  it('warnt bei Wirkungsgrad über 100%', () => {
    const warnungen = brennstoffbedarf.warnungen?.({ Qnutz: 100, Qbrennstoff: 50 }, 'eta', { eta: 2 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
