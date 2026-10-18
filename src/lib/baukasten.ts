/**
 * Rohrleitungs-Baukasten: baut einen Rohrstrang aus Elementen zusammen und berechnet
 * Geschwindigkeit, Reynoldszahl, λ (über die bestehende Colebrook-Implementierung) und
 * Druckverlust je Element - nichts davon dupliziert eine Formel aus der Registry, sondern nutzt
 * dieselben Bausteine (rohrreibungszahl, G, dynamicToKinematic).
 */
import { rohrreibungszahl } from './colebrook'
import { dynamicToKinematic, G } from '../units'

export interface Medium {
  rhoKgM3: number
  etaPas: number
}

export type BaukastenElement =
  | { typ: 'rohr'; id: string; name: string; innenDurchmesserM: number; laengeM: number; rauheitM: number }
  | { typ: 'einzelwiderstand'; id: string; name: string; zeta: number; bezugsDurchmesserM: number }
  | { typ: 'ventilKv'; id: string; name: string; kvM3hBar: number }
  | { typ: 'erweiterung'; id: string; name: string; a1M2: number; a2M2: number }
  | { typ: 'verengung'; id: string; name: string; a1M2: number; a2M2: number; zeta: number }
  | { typ: 'hoehenunterschied'; id: string; name: string; deltaZM: number }

export type ElementKategorie = 'reibung' | 'einzelwiderstand' | 'geodaesie'

export interface ElementErgebnis {
  elementId: string
  geschwindigkeitMS?: number
  reynoldszahl?: number
  lambda?: number
  druckverlustPa: number
  kategorie: ElementKategorie
}

export interface StrangErgebnis {
  elemente: ElementErgebnis[]
  summeReibungPa: number
  summeEinzelwiderstandPa: number
  summeGeodaesiePa: number
  summeGesamtPa: number
  /** Gesamtdruckverlust als Förderhöhe, direkt an die Pumpen-Betriebspunkt-Seite übergebbar. */
  foerderhoeheM: number
}

/** Berechnet ein einzelnes Element - Volumenstrom und Medium gelten für den ganzen Strang. */
export function berechneElement(element: BaukastenElement, medium: Medium, volumenstromM3s: number): ElementErgebnis {
  switch (element.typ) {
    case 'rohr': {
      if (element.innenDurchmesserM <= 0) throw new Error('Innendurchmesser muss größer 0 sein')
      const A = (Math.PI * element.innenDurchmesserM ** 2) / 4
      const v = volumenstromM3s / A
      const nu = dynamicToKinematic(medium.etaPas, medium.rhoKgM3)
      const re = (v * element.innenDurchmesserM) / nu
      const lambda = rohrreibungszahl(re, element.rauheitM, element.innenDurchmesserM)
      const druckverlustPa = lambda * (element.laengeM / element.innenDurchmesserM) * medium.rhoKgM3 * v ** 2 / 2
      return { elementId: element.id, geschwindigkeitMS: v, reynoldszahl: re, lambda, druckverlustPa, kategorie: 'reibung' }
    }
    case 'einzelwiderstand': {
      if (element.bezugsDurchmesserM <= 0) throw new Error('Bezugsdurchmesser muss größer 0 sein')
      const A = (Math.PI * element.bezugsDurchmesserM ** 2) / 4
      const v = volumenstromM3s / A
      const druckverlustPa = (element.zeta * medium.rhoKgM3 * v ** 2) / 2
      return { elementId: element.id, geschwindigkeitMS: v, druckverlustPa, kategorie: 'einzelwiderstand' }
    }
    case 'ventilKv': {
      if (element.kvM3hBar <= 0) throw new Error('Kv-Wert muss größer 0 sein')
      const vDotM3h = volumenstromM3s * 3600
      // Δp = (V̇ / Kv)² · ρ / 1000, Δp in bar, V̇ in m³/h, ρ in kg/m³ (VDI/VDE 2173)
      const dpBar = (vDotM3h / element.kvM3hBar) ** 2 * (medium.rhoKgM3 / 1000)
      return { elementId: element.id, druckverlustPa: dpBar * 1e5, kategorie: 'einzelwiderstand' }
    }
    case 'erweiterung': {
      if (element.a1M2 <= 0 || element.a2M2 <= 0) throw new Error('Querschnittsflächen müssen größer 0 sein')
      const v1 = volumenstromM3s / element.a1M2
      const zeta = (1 - element.a1M2 / element.a2M2) ** 2 // Borda-Carnot, bezogen auf v1
      const druckverlustPa = (zeta * medium.rhoKgM3 * v1 ** 2) / 2
      return { elementId: element.id, geschwindigkeitMS: v1, druckverlustPa, kategorie: 'einzelwiderstand' }
    }
    case 'verengung': {
      if (element.a1M2 <= 0 || element.a2M2 <= 0) throw new Error('Querschnittsflächen müssen größer 0 sein')
      const v2 = volumenstromM3s / element.a2M2 // Richtwert-ζ bezogen auf die engere Fläche
      const druckverlustPa = (element.zeta * medium.rhoKgM3 * v2 ** 2) / 2
      return { elementId: element.id, geschwindigkeitMS: v2, druckverlustPa, kategorie: 'einzelwiderstand' }
    }
    case 'hoehenunterschied': {
      const druckverlustPa = medium.rhoKgM3 * G * element.deltaZM
      return { elementId: element.id, druckverlustPa, kategorie: 'geodaesie' }
    }
  }
}

export function berechneStrang(elemente: BaukastenElement[], medium: Medium, volumenstromM3s: number): StrangErgebnis {
  const ergebnisse = elemente.map((e) => berechneElement(e, medium, volumenstromM3s))
  const summeNach = (kategorie: ElementKategorie) =>
    ergebnisse.filter((e) => e.kategorie === kategorie).reduce((sum, e) => sum + e.druckverlustPa, 0)

  const summeReibungPa = summeNach('reibung')
  const summeEinzelwiderstandPa = summeNach('einzelwiderstand')
  const summeGeodaesiePa = summeNach('geodaesie')
  const summeGesamtPa = summeReibungPa + summeEinzelwiderstandPa + summeGeodaesiePa

  return {
    elemente: ergebnisse,
    summeReibungPa,
    summeEinzelwiderstandPa,
    summeGeodaesiePa,
    summeGesamtPa,
    foerderhoeheM: summeGesamtPa / (medium.rhoKgM3 * G),
  }
}

/** Anlagenkennlinie H_A(V̇) über einen Volumenstrombereich - direkt an Pumpen-Betriebspunkt übergebbar. */
export function anlagenkennlinie(
  elemente: BaukastenElement[],
  medium: Medium,
  volumenstroemeM3s: number[],
): { vM3h: number; hM: number }[] {
  return volumenstroemeM3s.map((v) => ({ vM3h: v * 3600, hM: berechneStrang(elemente, medium, v).foerderhoeheM }))
}
