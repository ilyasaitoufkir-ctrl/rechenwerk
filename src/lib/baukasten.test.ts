import { describe, it, expect } from 'vitest'
import { alleFormeln } from '../formulas/registry'
import { rohrreibungszahl } from './colebrook'
import { G } from '../units'
import { berechneElement, berechneStrang, anlagenkennlinie, type BaukastenElement } from './baukasten'

describe('Baukasten: gerades Rohr ergibt exakt dasselbe wie der bestehende Druckverlustrechner', () => {
  it('einzelnes gerades Rohr (ohne weitere Elemente) stimmt mit druckverlust-darcy-weisbach überein', () => {
    const druckverlust = alleFormeln.find((f) => f.id === 'druckverlust-darcy-weisbach')!
    const medium = { rhoKgM3: 1000, etaPas: 0.001 }
    const volumenstromM3s = 0.0157 // ~2 m/s bei d=100mm
    const rohr: BaukastenElement = { typ: 'rohr', id: 'r1', name: 'Rohr', innenDurchmesserM: 0.1, laengeM: 100, rauheitM: 0.0001 }

    const ergebnisBaukasten = berechneStrang([rohr], medium, volumenstromM3s)
    const elementErgebnis = ergebnisBaukasten.elemente[0]

    const lambdaErwartet = rohrreibungszahl(elementErgebnis.reynoldszahl!, rohr.rauheitM, rohr.innenDurchmesserM)
    const erwartet = druckverlust.compute(
      { lambda: lambdaErwartet, L: rohr.laengeM, d: rohr.innenDurchmesserM, zeta: 0, rho: medium.rhoKgM3, v: elementErgebnis.geschwindigkeitMS! },
      'dp',
    )

    expect(elementErgebnis.lambda).toBeCloseTo(lambdaErwartet, 10)
    expect(elementErgebnis.druckverlustPa).toBeCloseTo(erwartet.dp, 6)
    expect(ergebnisBaukasten.summeGesamtPa).toBeCloseTo(erwartet.dp, 6)
    expect(ergebnisBaukasten.foerderhoeheM).toBeCloseTo(erwartet.dp / (medium.rhoKgM3 * G), 9)
  })
})

describe('Baukasten: Ventil über Kv-Wert', () => {
  it('V̇ = Kv und ρ = 1000 kg/m³ ergibt exakt 1 bar Δp (VDI/VDE 2173)', () => {
    const medium = { rhoKgM3: 1000, etaPas: 0.001 }
    const kv = 25 // m³/h
    const volumenstromM3s = kv / 3600 // V̇ = Kv (in m³/h)
    const ventil: BaukastenElement = { typ: 'ventilKv', id: 'v1', name: 'Ventil', kvM3hBar: kv }

    const ergebnis = berechneElement(ventil, medium, volumenstromM3s)
    expect(ergebnis.druckverlustPa / 1e5).toBeCloseTo(1, 9)
  })
})

describe('Baukasten: plötzliche Erweiterung (Borda-Carnot)', () => {
  it('A1/A2 = 0,5 ergibt ζ = 0,25', () => {
    const medium = { rhoKgM3: 1000, etaPas: 0.001 }
    const a1 = 0.01
    const a2 = a1 / 0.5 // A1/A2 = 0,5
    const v1 = 2
    const volumenstromM3s = v1 * a1
    const erweiterung: BaukastenElement = { typ: 'erweiterung', id: 'e1', name: 'Erweiterung', a1M2: a1, a2M2: a2 }

    const ergebnis = berechneElement(erweiterung, medium, volumenstromM3s)
    const zetaErwartet = 0.25
    const dpErwartet = (zetaErwartet * medium.rhoKgM3 * v1 ** 2) / 2
    expect(ergebnis.druckverlustPa).toBeCloseTo(dpErwartet, 9)
  })
})

describe('Baukasten: Höhenunterschied', () => {
  it('10 m Wasser ergibt ca. 0,98 bar', () => {
    const medium = { rhoKgM3: 1000, etaPas: 0.001 }
    const hoehe: BaukastenElement = { typ: 'hoehenunterschied', id: 'h1', name: 'Höhe', deltaZM: 10 }
    const ergebnis = berechneElement(hoehe, medium, 0.02)
    expect(ergebnis.druckverlustPa / 1e5).toBeCloseTo(0.980665, 4)
  })
})

describe('Baukasten: Summenbildung getrennt nach Reibung/Einzelwiderstand/Geodäsie', () => {
  it('ein Strang mit Rohr, Bogen (ζ), Ventil und Höhenunterschied summiert korrekt getrennt', () => {
    const medium = { rhoKgM3: 998, etaPas: 0.001 }
    const volumenstromM3s = 0.01
    const elemente: BaukastenElement[] = [
      { typ: 'rohr', id: 'rohr1', name: 'Rohr', innenDurchmesserM: 0.08, laengeM: 50, rauheitM: 0.00005 },
      { typ: 'einzelwiderstand', id: 'bogen1', name: 'Bogen 90°', zeta: 0.3, bezugsDurchmesserM: 0.08 },
      { typ: 'einzelwiderstand', id: 'bogen2', name: 'Bogen 90°', zeta: 0.3, bezugsDurchmesserM: 0.08 },
      { typ: 'ventilKv', id: 'ventil1', name: 'Ventil', kvM3hBar: 20 },
      { typ: 'hoehenunterschied', id: 'hoehe1', name: 'Höhe', deltaZM: 5 },
    ]
    const strang = berechneStrang(elemente, medium, volumenstromM3s)

    expect(strang.summeReibungPa).toBeGreaterThan(0)
    expect(strang.summeEinzelwiderstandPa).toBeGreaterThan(0)
    expect(strang.summeGeodaesiePa).toBeCloseTo(medium.rhoKgM3 * G * 5, 6)
    expect(strang.summeGesamtPa).toBeCloseTo(
      strang.summeReibungPa + strang.summeEinzelwiderstandPa + strang.summeGeodaesiePa,
      9,
    )
    expect(strang.foerderhoeheM).toBeCloseTo(strang.summeGesamtPa / (medium.rhoKgM3 * G), 9)
  })
})

describe('anlagenkennlinie', () => {
  it('liefert für jeden Volumenstrom die Förderhöhe des Strangs bei genau diesem Volumenstrom', () => {
    const medium = { rhoKgM3: 1000, etaPas: 0.001 }
    const elemente: BaukastenElement[] = [
      { typ: 'rohr', id: 'rohr1', name: 'Rohr', innenDurchmesserM: 0.1, laengeM: 100, rauheitM: 0.0001 },
      { typ: 'hoehenunterschied', id: 'hoehe1', name: 'Höhe', deltaZM: 8 },
    ]
    const volumenstroeme = [0.005, 0.01, 0.015, 0.02]
    const kennlinie = anlagenkennlinie(elemente, medium, volumenstroeme)

    expect(kennlinie).toHaveLength(4)
    for (let i = 0; i < volumenstroeme.length; i++) {
      expect(kennlinie[i].vM3h).toBeCloseTo(volumenstroeme[i] * 3600, 9)
      expect(kennlinie[i].hM).toBeCloseTo(berechneStrang(elemente, medium, volumenstroeme[i]).foerderhoeheM, 9)
    }
    // Reibungsdominierter Strang: Förderhöhe muss mit dem Volumenstrom monoton steigen.
    expect(kennlinie[3].hM).toBeGreaterThan(kennlinie[0].hM)
  })
})
