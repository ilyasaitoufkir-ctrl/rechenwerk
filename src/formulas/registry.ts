import type { Formula } from '../types/formula'
import { kontinuitaet } from './stroemung/kontinuitaet'
import { rohrAuslegen } from './stroemung/rohr-auslegen'
import { reynolds } from './stroemung/reynolds'
import { rohrreibungszahl } from './stroemung/rohrreibungszahl'
import { druckverlust } from './stroemung/druckverlust'
import { hydrostatischerDruck } from './stroemung/hydrostatischer-druck'
import { ausflussBehaelter } from './stroemung/ausfluss-behaelter'
import { fuellEntleerzeit } from './stroemung/fuell-entleerzeit'

/**
 * Formel-Registry: eine neue Formel hinzuzufügen heißt, hier einen Import
 * und Eintrag zu ergänzen - der Rest der App (Rechner, Suche, Bibliothek)
 * entsteht automatisch daraus. Details siehe ANLEITUNG.md.
 */
export const alleFormeln: Formula[] = [
  kontinuitaet,
  rohrAuslegen,
  reynolds,
  rohrreibungszahl,
  druckverlust,
  hydrostatischerDruck,
  ausflussBehaelter,
  fuellEntleerzeit,
]

export function getFormel(id: string): Formula | undefined {
  return alleFormeln.find((f) => f.id === id)
}

export function getKategorien(): string[] {
  return Array.from(new Set(alleFormeln.map((f) => f.kategorie)))
}

export function sucheFormeln(query: string): Formula[] {
  const q = query.trim().toLowerCase()
  if (!q) return alleFormeln
  return alleFormeln.filter((f) => {
    const haystack = [f.name, f.kategorie, ...f.stichworte].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}
