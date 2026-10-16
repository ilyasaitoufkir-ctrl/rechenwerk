import { describe, it, expect } from 'vitest'
import { foerderhoeheMessung } from './foerderhoehe-messung'

describe('Förderhöhe aus Messwerten', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = foerderhoeheMessung.beispiel
    const ergebnis = foerderhoeheMessung.compute(bekannt, ziel)
    expect(ergebnis.H).toBeCloseTo(erwartet.H, 4)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // Δp=1,5 bar=150000 Pa, ρ=998, Δz=0,5m, v1=0,5m/s, v2=1,5m/s
    // H = 150000/(998*9,80665) + 0,5 + (2,25-0,25)/(2*9,80665) = 15,928368 m
    const ergebnis = foerderhoeheMessung.compute({ dp: 150000, rho: 998, dz: 0.5, v1: 0.5, v2: 1.5 }, 'H')
    expect(ergebnis.H).toBeCloseTo(15.928368, 5)
  })

  it('warnt bei negativer Förderhöhe', () => {
    const warnungen = foerderhoeheMessung.warnungen?.({}, 'H', { H: -2 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
