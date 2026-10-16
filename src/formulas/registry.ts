import type { Formula } from '../types/formula'
import { kontinuitaet } from './stroemung/kontinuitaet'
import { rohrAuslegen } from './stroemung/rohr-auslegen'
import { reynolds } from './stroemung/reynolds'
import { rohrreibungszahl } from './stroemung/rohrreibungszahl'
import { druckverlust } from './stroemung/druckverlust'
import { hydrostatischerDruck } from './stroemung/hydrostatischer-druck'
import { ausflussBehaelter } from './stroemung/ausfluss-behaelter'
import { fuellEntleerzeit } from './stroemung/fuell-entleerzeit'
import { fuehlbareWaermeEnergie } from './waerme/fuehlbare-waerme-energie'
import { fuehlbareWaermeLeistung } from './waerme/fuehlbare-waerme-leistung'
import { waermeleitungEbeneWand } from './waerme/waermeleitung-ebene-wand'
import { waermedurchgangskoeffizient } from './waerme/waermedurchgangskoeffizient'
import { logMittlereTemperaturdifferenz } from './waerme/log-mittlere-temperaturdifferenz'
import { waermetauscherGrob } from './waerme/waermetauscher-grob'
import { waermeverlustRohrDaemmung } from './waerme/waermeverlust-rohr-daemmung'
import { dampfZustandFluessig } from './dampf/dampf-zustand-fluessig'
import { dampfZustandDampf } from './dampf/dampf-zustand-dampf'
import { dampfSaettigung } from './dampf/dampf-saettigung'
import { dampfbedarfAufheizen } from './dampf/dampfbedarf-aufheizen'
import { dampfkosten } from './dampf/dampfkosten'
import { dampfverlustLeckage } from './dampf/dampfverlust-leckage'
import { erdgasAbrechnung } from './energie-kosten/erdgas-abrechnung'
import { brennstoffbedarf } from './energie-kosten/brennstoffbedarf'
import { co2Emissionen } from './energie-kosten/co2-emissionen'
import { stromkosten } from './energie-kosten/stromkosten'
import { druckluftLeckage } from './energie-kosten/druckluft-leckage'
import { grundlastenergie } from './energie-kosten/grundlastenergie'
import { grundlastquote } from './energie-kosten/grundlastquote'
import { statischeAmortisation } from './energie-kosten/statische-amortisation'
import { kapitalwert } from './energie-kosten/kapitalwert'
import { annuitaet } from './energie-kosten/annuitaet'
import { internerZinsfuss } from './energie-kosten/interner-zinsfuss'

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
  fuehlbareWaermeEnergie,
  fuehlbareWaermeLeistung,
  waermeleitungEbeneWand,
  waermedurchgangskoeffizient,
  logMittlereTemperaturdifferenz,
  waermetauscherGrob,
  waermeverlustRohrDaemmung,
  dampfZustandFluessig,
  dampfZustandDampf,
  dampfSaettigung,
  dampfbedarfAufheizen,
  dampfkosten,
  dampfverlustLeckage,
  erdgasAbrechnung,
  brennstoffbedarf,
  co2Emissionen,
  stromkosten,
  druckluftLeckage,
  grundlastenergie,
  grundlastquote,
  statischeAmortisation,
  kapitalwert,
  annuitaet,
  internerZinsfuss,
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
