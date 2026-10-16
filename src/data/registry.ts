import type { Quelle } from '../types/formula'
import { rauheitsQuelle, rauheitstabelle } from './roughness'
import { pipesDin11850Quelle, din11850Reihe2 } from './pipes-din11850'
import { fittingsQuelle, einbauten } from './fittings'
import { stoffdatenQuelle, stoffdatenWaerme } from './stoffdaten-waerme'
import { emissionsfaktorenQuelle, emissionsfaktoren } from './emissionsfaktoren'
import { werkstoffdichtenQuelle, werkstoffdichten } from './werkstoffdichten'

export interface DatenTabelle {
  id: string
  name: string
  kategorie: string
  quelle: Quelle
}

/**
 * Registry aller Datentabellen (Rauheiten, Rohrmaße, Einbauten, Stoffdaten,
 * Emissionsfaktoren) - für die Prüfliste, damit auch Tabellen (nicht nur
 * Formeln) einen Verifizierungsstatus bekommen können.
 */
export const alleDatenTabellen: DatenTabelle[] = [
  { id: 'tabelle-rauheit', name: 'Rauheitstabelle', kategorie: 'Strömung & Rohrleitungen', quelle: rauheitsQuelle },
  { id: 'tabelle-din11850', name: 'Rohrtabelle DIN 11850 Reihe 2', kategorie: 'Strömung & Rohrleitungen', quelle: pipesDin11850Quelle },
  { id: 'tabelle-einbauten', name: 'Widerstandsbeiwerte Einbauten', kategorie: 'Strömung & Rohrleitungen', quelle: fittingsQuelle },
  { id: 'tabelle-stoffdaten-waerme', name: 'Stoffdaten Wärmeübertragung', kategorie: 'Wärmeübertragung', quelle: stoffdatenQuelle },
  { id: 'tabelle-emissionsfaktoren', name: 'CO₂-Emissionsfaktoren', kategorie: 'Energie & Kosten', quelle: emissionsfaktorenQuelle },
  { id: 'tabelle-werkstoffdichten', name: 'Werkstoffdichten', kategorie: 'Behälter & Geometrie', quelle: werkstoffdichtenQuelle },
]

const ZEILEN: Record<string, readonly unknown[]> = {
  'tabelle-rauheit': rauheitstabelle,
  'tabelle-din11850': din11850Reihe2,
  'tabelle-einbauten': einbauten,
  'tabelle-stoffdaten-waerme': stoffdatenWaerme,
  'tabelle-emissionsfaktoren': emissionsfaktoren,
  'tabelle-werkstoffdichten': werkstoffdichten,
}

export function getDatenTabelle(id: string): DatenTabelle | undefined {
  return alleDatenTabellen.find((t) => t.id === id)
}

/**
 * Liefert die Zeilen einer Datentabelle, optional nach einem Suchbegriff
 * gefiltert (einfache Freitextsuche über alle Feldwerte der Zeile) - z. B.
 * für den KI-Assistenten, der nicht auf eine konkrete Zeilenstruktur
 * zugeschnitten sein kann.
 */
export function getZeilen(id: string, suchbegriff?: string): unknown[] {
  const zeilen = ZEILEN[id]
  if (!zeilen) throw new Error(`Unbekannte Datentabelle "${id}"`)
  if (!suchbegriff?.trim()) return [...zeilen]
  const q = suchbegriff.trim().toLowerCase()
  return zeilen.filter((z) => JSON.stringify(z).toLowerCase().includes(q))
}
