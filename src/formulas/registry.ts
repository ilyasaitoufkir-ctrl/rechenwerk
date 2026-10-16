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
import { foerderhoeheMessung } from './pumpen/foerderhoehe-messung'
import { pumpenleistung } from './pumpen/pumpenleistung'
import { npsh } from './pumpen/npsh'
import { verdraengerpumpe } from './pumpen/verdraengerpumpe'
import { affinitaetsgesetze } from './pumpen/affinitaetsgesetze'
import { drehzahlDrosselVergleich } from './pumpen/drehzahl-drossel-vergleich'
import { zylinderschaleEn13445 } from './druckgeraete/zylinderschale-en13445'
import { kugelschaleEn13445 } from './druckgeraete/kugelschale-en13445'
import { zylinderschaleAd2000B1 } from './druckgeraete/zylinderschale-ad2000-b1'
import { pruefdruckDgrl } from './druckgeraete/pruefdruck-dgrl'
import { dgrlEinstufungBehaelter } from './druckgeraete/dgrl-einstufung-behaelter'
import { dgrlEinstufungRohrleitung } from './druckgeraete/dgrl-einstufung-rohrleitung'
import { gleichgewichtskurve } from './rektifikation/gleichgewichtskurve'
import { dampfdruckAntoine } from './rektifikation/dampfdruck-antoine'
import { siedepunkt } from './rektifikation/siedepunkt'
import { taupunkt } from './rektifikation/taupunkt'
import { massenbilanzKolonne } from './rektifikation/massenbilanz-kolonne'
import { fenskeMindeststufenzahl } from './rektifikation/fenske-mindeststufenzahl'
import { mindestrueckverhaeltnis } from './rektifikation/mindestrueckverhaeltnis'
import { gillilandStufenzahl } from './rektifikation/gilliland-stufenzahl'
import { kondensatorWaermelast } from './rektifikation/kondensator-waermelast'
import { sicherheitsventilGasDampf } from './sicherheitsventile/sicherheitsventil-gas-dampf'
import { sicherheitsventilFluessigkeit } from './sicherheitsventile/sicherheitsventil-fluessigkeit'
import { dosierKalibrierung } from './dosierung-mischen/dosier-kalibrierung'
import { mischungMassenbilanz } from './dosierung-mischen/mischung-massenbilanz'
import { mischungskreuz } from './dosierung-mischen/mischungskreuz'
import { verduennung } from './dosierung-mischen/verduennung'
import { mischtemperatur } from './dosierung-mischen/mischtemperatur'
import { volumenZylinder } from './geometrie/volumen-zylinder'
import { volumenKegelstumpf } from './geometrie/volumen-kegelstumpf'
import { volumenKugel } from './geometrie/volumen-kugel'
import { volumenQuader } from './geometrie/volumen-quader'
import { liegenderZylinderTeilfuellung } from './geometrie/liegender-zylinder-teilfuellung'
import { stehenderZylinderFuellstand } from './geometrie/stehender-zylinder-fuellstand'
import { blechgewichtKreisflaeche } from './geometrie/blechgewicht-kreisflaeche'
import { blechgewichtZylindermantel } from './geometrie/blechgewicht-zylindermantel'
import { blechgewichtKegelstumpfmantel } from './geometrie/blechgewicht-kegelstumpfmantel'

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
  foerderhoeheMessung,
  pumpenleistung,
  npsh,
  verdraengerpumpe,
  affinitaetsgesetze,
  drehzahlDrosselVergleich,
  dosierKalibrierung,
  mischungMassenbilanz,
  mischungskreuz,
  verduennung,
  mischtemperatur,
  volumenZylinder,
  volumenKegelstumpf,
  volumenKugel,
  volumenQuader,
  liegenderZylinderTeilfuellung,
  stehenderZylinderFuellstand,
  blechgewichtKreisflaeche,
  blechgewichtZylindermantel,
  blechgewichtKegelstumpfmantel,
  zylinderschaleEn13445,
  kugelschaleEn13445,
  zylinderschaleAd2000B1,
  pruefdruckDgrl,
  dgrlEinstufungBehaelter,
  dgrlEinstufungRohrleitung,
  sicherheitsventilGasDampf,
  sicherheitsventilFluessigkeit,
  gleichgewichtskurve,
  dampfdruckAntoine,
  siedepunkt,
  taupunkt,
  massenbilanzKolonne,
  fenskeMindeststufenzahl,
  mindestrueckverhaeltnis,
  gillilandStufenzahl,
  kondensatorWaermelast,
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
