import { describe, it, expect } from 'vitest'
import { npsh } from './npsh'
import { psatT } from '../../lib/iapws-if97'

describe('NPSH-Prüfung', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = npsh.beispiel
    const ergebnis = npsh.compute(bekannt, ziel)
    expect(ergebnis.NPSHA).toBeCloseTo(erwartet.NPSHA, 4)
  })

  it('Dampfdruck Wasser bei 20°C aus IF97 ≈ 2339 Pa (2,339 kPa)', () => {
    expect(psatT(293.15) * 1e6).toBeCloseTo(2339, -1)
  })

  it('Handrechnung: Saugbetrieb mit negativem z0 (unabhängig vom Beispiel)', () => {
    // p0abs=101325, pD=2339, ρ=998, z0=-2m (Saugbetrieb), HVSaug=0,3m, NPSHR=4, Zuschlag=0,5
    // NPSHA = (101325-2339)/(998*9,80665) - 2 - 0,3 = 10,11399 - 2,3 = 7,81399 m
    const ergebnis = npsh.compute(
      { p0abs: 101325, pD: 2339, rho: 998, z0: -2, HVSaug: 0.3, npshR: 4, zuschlag: 0.5 },
      'NPSHA',
    )
    expect(ergebnis.NPSHA).toBeCloseTo(7.81399, 4)
  })

  it('warnt bei Kavitationsgefahr (NPSHA < NPSHR)', () => {
    const warnungen = npsh.warnungen?.(
      { npshR: 5, zuschlag: 0.5 } as Record<string, number>,
      'NPSHA',
      { NPSHA: 3, npshR: 5, zuschlag: 0.5 },
    )
    expect(warnungen?.some((w) => w.includes('Kavitationsgefahr'))).toBe(true)
  })

  it('warnt bei knappem NPSH (zwischen NPSHR und NPSHR+Zuschlag)', () => {
    const warnungen = npsh.warnungen?.(
      { npshR: 5, zuschlag: 1 } as Record<string, number>,
      'NPSHA',
      { NPSHA: 5.3, npshR: 5, zuschlag: 1 },
    )
    expect(warnungen?.some((w) => w.includes('knapp'))).toBe(true)
  })

  it('empfiehlt, wenn NPSH ausreichend ist', () => {
    const empfehlung = npsh.empfehlung?.({ NPSHA: 10, npshR: 5, zuschlag: 1 })
    expect(empfehlung).toMatch(/ausreichend/)
  })
})
