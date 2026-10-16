import { describe, it, expect } from 'vitest'
import { zylinderschaleAd2000B1 } from './zylinderschale-ad2000-b1'

describe('Zylinderschale unter Innendruck (AD 2000-Merkblatt B1)', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = zylinderschaleAd2000B1.beispiel
    const ergebnis = zylinderschaleAd2000B1.compute(bekannt, ziel)
    expect(ergebnis.s).toBeCloseTo(erwartet.s, 6)
  })

  it('Rückwärtsrechnung trifft den Ausgangsdruck', () => {
    const { bekannt, ziel } = zylinderschaleAd2000B1.beispiel
    const vorwaerts = zylinderschaleAd2000B1.compute(bekannt, ziel)
    const { p, ...rest } = bekannt
    const rueckwaerts = zylinderschaleAd2000B1.compute({ ...rest, s: vorwaerts.s }, 'p')
    expect(rueckwaerts.p).toBeCloseTo(p, 3)
  })

  it('Handrechnung mit anderen Werten (unabhängig vom Beispiel)', () => {
    // p=10 bar=1e6 Pa, Da=510mm=0,51m, K=200 N/mm²=2e8 Pa, S=1,5, v=1,0, c1=0, c2=0
    // s_mm = 510*10/(20*(200/1,5)*1+10) = 5100/2676,667 = 1,905355 mm
    const ergebnis = zylinderschaleAd2000B1.compute(
      { p: 1e6, Da: 0.51, K: 2e8, S: 1.5, v: 1, c1: 0, c2: 0 },
      's',
    )
    expect(ergebnis.s * 1000).toBeCloseTo(1.905355, 4)
  })

  it('wirft Fehler bei Sicherheitsbeiwert S <= 0', () => {
    expect(() =>
      zylinderschaleAd2000B1.compute({ p: 1e6, Da: 1, K: 2e8, S: 0, v: 1, c1: 0, c2: 0 }, 's'),
    ).toThrow()
  })

  it('erwähnt den Druckgeräte-Pflichthinweis in den Annahmen', () => {
    expect(zylinderschaleAd2000B1.annahmen.some((a) => a.includes('Ersetzt keine normgerechte Berechnung'))).toBe(
      true,
    )
  })
})
