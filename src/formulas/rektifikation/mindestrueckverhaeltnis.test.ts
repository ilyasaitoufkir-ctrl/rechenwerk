import { describe, it, expect } from 'vitest'
import { mindestrueckverhaeltnis } from './mindestrueckverhaeltnis'

describe('Mindestrücklaufverhältnis (Formel)', () => {
  it('reproduziert das hinterlegte Beispiel: y*≈0,7143, Rmin≈1,10', () => {
    const { bekannt, ziel, erwartet } = mindestrueckverhaeltnis.beispiel
    const ergebnis = mindestrueckverhaeltnis.compute(bekannt, ziel)
    expect(ergebnis.yStern).toBeCloseTo(erwartet.yStern, 4)
    expect(ergebnis.Rmin).toBeCloseTo(erwartet.Rmin, 1)
  })

  it('Handrechnung: gesättigter Dampf-Zulauf (q=0, unabhängig vom Beispiel)', () => {
    // Bei q=0 ist die q-Linie horizontal: y=xF -> Schnittpunkt mit Gleichgewichtskurve bei y=xF
    const alpha = 2.5
    const xF = 0.5
    const ergebnis = mindestrueckverhaeltnis.compute({ alpha, xF, xD: 0.95, q: 0 }, 'Rmin')
    expect(ergebnis.yStern).toBeCloseTo(xF, 6)
  })

  it('warnt bei Rmin <= 0', () => {
    const warnungen = mindestrueckverhaeltnis.warnungen?.({}, 'Rmin', { Rmin: -0.1 }) ?? []
    expect(warnungen.length).toBeGreaterThan(0)
  })
})
