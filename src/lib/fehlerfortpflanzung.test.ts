import { describe, it, expect } from 'vitest'
import { fehlerfortpflanzung } from './fehlerfortpflanzung'
import { alleFormeln } from '../formulas/registry'

describe('Gaußsche Fehlerfortpflanzung', () => {
  it('y = a·b: relative Unsicherheit stimmt mit sqrt((ua/a)² + (ub/b)²) überein', () => {
    const a = 10
    const b = 5
    const ua = 0.2
    const ub = 0.1
    const r = fehlerfortpflanzung((w) => w.a * w.b, { a, b }, { a: ua, b: ub })
    const relativErwartet = Math.sqrt((ua / a) ** 2 + (ub / b) ** 2)
    const relativBerechnet = r.kombinierteUnsicherheit / r.basis
    expect(relativBerechnet).toBeCloseTo(relativErwartet, 6)
  })

  it('Handrechnung: y = a + b, Unsicherheiten addieren sich quadratisch (unabhängig vom Beispiel)', () => {
    // u_y = sqrt(ua²+ub²) = sqrt(3²+4²) = 5
    const r = fehlerfortpflanzung((w) => w.a + w.b, { a: 10, b: 20 }, { a: 3, b: 4 })
    expect(r.basis).toBeCloseTo(30, 9)
    expect(r.kombinierteUnsicherheit).toBeCloseTo(5, 4)
  })

  it('Unsicherheit 0 bei einer Eingabe trägt nicht zur Gesamtunsicherheit bei', () => {
    const r = fehlerfortpflanzung((w) => w.a * w.b, { a: 10, b: 5 }, { a: 0, b: 0.1 })
    const nullBeitrag = r.beitraege.find((b) => b.id === 'a')
    expect(nullBeitrag?.beitrag).toBe(0)
    expect(r.kombinierteUnsicherheit).toBeGreaterThan(0)
  })

  it('wirft Fehler, wenn das Ergebnis an der Basisstelle nicht definiert ist', () => {
    expect(() => fehlerfortpflanzung((w) => w.a / w.b, { a: 1, b: 0 }, { a: 0.1, b: 0.1 })).toThrow()
  })

  it('funktioniert generisch mit mehreren echten Formeln der Registry, nicht nur fest verdrahtet', () => {
    const stichprobe = alleFormeln.filter((f) =>
      ['kontinuitaet', 'hydrostatischer-druck', 'volumen-kugel', 'verduennung'].includes(f.id),
    )
    expect(stichprobe.length).toBe(4)

    for (const formel of stichprobe) {
      const { bekannt, ziel } = formel.beispiel
      const unsicherheiten: Record<string, number> = {}
      for (const key of Object.keys(bekannt)) {
        unsicherheiten[key] = Math.abs(bekannt[key]) * 0.01 || 0.001
      }
      const r = fehlerfortpflanzung((w) => formel.compute(w, ziel)[ziel], bekannt, unsicherheiten)
      expect(Number.isFinite(r.basis)).toBe(true)
      expect(Number.isFinite(r.kombinierteUnsicherheit)).toBe(true)
      expect(r.kombinierteUnsicherheit).toBeGreaterThanOrEqual(0)
      expect(r.beitraege.length).toBe(Object.keys(bekannt).length)
    }
  })
})
