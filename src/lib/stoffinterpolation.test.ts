import { describe, it, expect } from 'vitest'
import { interpoliereStoffwert, stoffwertBeiTemperatur } from './stoffinterpolation'
import type { StoffStuetzstelle } from './storage'

const STUETZSTELLEN: StoffStuetzstelle[] = [
  { temperaturK: 273.15, dichteKgM3: 1000, viskositaetPas: 0.0018 },
  { temperaturK: 293.15, dichteKgM3: 998, viskositaetPas: 0.001 },
  { temperaturK: 353.15, dichteKgM3: 965, viskositaetPas: 0.00035 },
]

describe('interpoliereStoffwert', () => {
  it('liefert an einer Stützstelle exakt den hinterlegten Wert', () => {
    const r = interpoliereStoffwert(STUETZSTELLEN, 'dichteKgM3', 293.15)
    expect(r?.wert).toBe(998)
    expect(r?.ausserhalbBereich).toBe(false)
  })

  it('interpoliert linear zwischen zwei Stützstellen', () => {
    // Handrechnung: Mitte zwischen 273,15 (1000) und 293,15 (998) bei 283,15 -> 999
    const r = interpoliereStoffwert(STUETZSTELLEN, 'dichteKgM3', 283.15)
    expect(r?.wert).toBeCloseTo(999, 9)
    expect(r?.ausserhalbBereich).toBe(false)
  })

  it('markiert Werte unterhalb des Bereichs und liefert den Randwert', () => {
    const r = interpoliereStoffwert(STUETZSTELLEN, 'dichteKgM3', 250)
    expect(r?.wert).toBe(1000)
    expect(r?.ausserhalbBereich).toBe(true)
  })

  it('markiert Werte oberhalb des Bereichs und liefert den Randwert', () => {
    const r = interpoliereStoffwert(STUETZSTELLEN, 'dichteKgM3', 400)
    expect(r?.wert).toBe(965)
    expect(r?.ausserhalbBereich).toBe(true)
  })

  it('liefert null, wenn keine Stützstelle die Eigenschaft hat', () => {
    expect(interpoliereStoffwert(STUETZSTELLEN, 'lambdaWmK', 293.15)).toBeNull()
  })

  it('funktioniert mit genau einer Stützstelle', () => {
    const einePunkt: StoffStuetzstelle[] = [{ temperaturK: 300, cpJkgK: 4180 }]
    expect(interpoliereStoffwert(einePunkt, 'cpJkgK', 300)?.ausserhalbBereich).toBe(false)
    expect(interpoliereStoffwert(einePunkt, 'cpJkgK', 310)?.ausserhalbBereich).toBe(true)
  })
})

describe('stoffwertBeiTemperatur', () => {
  it('nutzt die Stützstellentabelle, wenn vorhanden', () => {
    const stoff = { stuetzstellen: STUETZSTELLEN, dichteKgM3: 999 }
    const r = stoffwertBeiTemperatur(stoff, 'dichteKgM3', 293.15)
    expect(r?.wert).toBe(998) // aus der Tabelle, nicht der feste Wert 999
  })

  it('nutzt den festen Wert, wenn keine Stützstellen vorhanden sind', () => {
    const stoff = { dichteKgM3: 850 }
    const r = stoffwertBeiTemperatur(stoff, 'dichteKgM3', 293.15)
    expect(r).toEqual({ wert: 850, ausserhalbBereich: false })
  })

  it('liefert null, wenn weder Tabelle noch fester Wert vorhanden ist', () => {
    expect(stoffwertBeiTemperatur({}, 'dichteKgM3', 293.15)).toBeNull()
  })
})
