import type { Quelle } from '../types/formula'
import { rauheitsQuelle } from './roughness'
import { pipesDin11850Quelle } from './pipes-din11850'
import { fittingsQuelle } from './fittings'
import { stoffdatenQuelle } from './stoffdaten-waerme'
import { emissionsfaktorenQuelle } from './emissionsfaktoren'
import { werkstoffdichtenQuelle } from './werkstoffdichten'

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
