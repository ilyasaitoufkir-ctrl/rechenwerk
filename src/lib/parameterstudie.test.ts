import { describe, it, expect } from 'vitest'
import { alleFormeln } from '../formulas/registry'
import { parameterstudieBereich, parameterstudieBerechnen } from './parameterstudie'

describe('parameterstudieBereich', () => {
  it('linear: exakt anzahl Punkte, gleichmäßig verteilt zwischen von und bis', () => {
    const pts = parameterstudieBereich(0, 10, 5, 'linear')
    expect(pts).toHaveLength(5)
    expect(pts).toEqual([0, 2.5, 5, 7.5, 10])
  })

  it('log: geometrische Verteilung, Start- und Endwert exakt getroffen', () => {
    const pts = parameterstudieBereich(1, 1000, 4, 'log')
    expect(pts[0]).toBeCloseTo(1, 9)
    expect(pts[3]).toBeCloseTo(1000, 6)
    expect(pts[1]).toBeCloseTo(10, 6)
    expect(pts[2]).toBeCloseTo(100, 6)
  })

  it('log mit Werten <= 0 wirft einen klaren Fehler', () => {
    expect(() => parameterstudieBereich(-1, 10, 5, 'log')).toThrow()
  })
})

describe('parameterstudieBerechnen', () => {
  const reynolds = alleFormeln.find((f) => f.id === 'reynolds')!

  it('jeder Punkt ist identisch mit einer Einzelrechnung über formel.compute()', () => {
    const werte = parameterstudieBereich(0.01, 1, 10, 'linear') // d von 10mm bis 1m (SI: m)
    const rest = { v: 2, nu: 1e-6 }
    const punkte = parameterstudieBerechnen(reynolds, 'Re', 'd', werte, rest)

    expect(punkte).toHaveLength(10)
    for (const p of punkte) {
      const einzelergebnis = reynolds.compute({ ...rest, d: p.x }, 'Re')
      expect(p.y).toBeCloseTo(einzelergebnis.Re, 9)
    }
  })

  it('liefert eine zweite Ausgabegröße, wenn angefordert (zusatzAusgabe)', () => {
    const druckverlust = alleFormeln.find((f) => f.id === 'druckverlust-darcy-weisbach')!
    const werte = parameterstudieBereich(0.05, 0.2, 4, 'linear')
    const rest = { lambda: 0.02, L: 100, zeta: 2, rho: 1000, v: 2 }
    const punkte = parameterstudieBerechnen(druckverlust, 'dp', 'd', werte, rest, 'h')

    for (const p of punkte) {
      const einzelergebnis = druckverlust.compute({ ...rest, d: p.x }, 'dp')
      expect(p.y).toBeCloseTo(einzelergebnis.dp, 6)
      expect(p.y2).toBeCloseTo(einzelergebnis.h, 6)
    }
  })

  it('markiert Punkte außerhalb min/max als Lücke statt sie zu verbinden', () => {
    const formelMitGrenze = alleFormeln.find((f) => f.id === 'sicherheitsventil-gas-dampf')! // alphaw: min 0, max 1
    const werte = [-0.5, 0, 0.5, 1, 1.5]
    const rest = { p0: 1e6, p2: 1e5, kappa: 1.4, rho0: 10, A: 1e-4 }
    const punkte = parameterstudieBerechnen(formelMitGrenze, 'mdot', 'alphaw', werte, rest)

    expect(punkte[0].y).toBeNull() // -0.5 < min 0
    expect(punkte[0].hinweis).toBeDefined()
    expect(punkte[4].y).toBeNull() // 1.5 > max 1
    expect(punkte[1].y).not.toBeNull() // 0 gültig
    expect(punkte[2].y).not.toBeNull()
    expect(punkte[3].y).not.toBeNull()
  })

  it('markiert einen Rechenfehler (z. B. Division durch 0) als Lücke mit Hinweis', () => {
    const werte = [0, 0.05, 0.1]
    const rest = { v: 2, nu: 1e-6 }
    const punkte = parameterstudieBerechnen(reynolds, 'Re', 'd', werte, rest)
    // d=0 führt bei Re = v*d/nu zu 0, nicht zu einem Fehler - daher hier bewusst eine Formel mit throw testen:
    const druckverlust = alleFormeln.find((f) => f.id === 'druckverlust-darcy-weisbach')!
    const punkte2 = parameterstudieBerechnen(druckverlust, 'dp', 'd', [0, 0.1], { lambda: 0.02, L: 100, zeta: 2, rho: 1000, v: 2 })
    expect(punkte2[0].y).toBeNull()
    expect(punkte2[0].hinweis).toBeDefined()
    expect(punkte2[1].y).not.toBeNull()
    expect(punkte).toHaveLength(3)
  })
})
