import type { Quelle } from '../types/formula'

/**
 * Rauheitswerte k (absolute hydraulische Rauheit, mm) für gängige Werkstoffe.
 * Es handelt sich durchweg um Richtwerte - reale Rohre streuen je nach
 * Fertigung, Alter und Zustand erheblich. "typ" ist ein praxisüblicher
 * Auslegungswert zwischen min und max.
 *
 * Quelle: Sigloch, Technische Fluidmechanik; Bohl/Elmendorf,
 * Technische Strömungslehre (Rauheitstabellen nach Moody). Die genaue
 * Kapitel-/Tabellennummer konnte nicht zweifelsfrei zugeordnet werden -
 * vor sicherheitsrelevanter Auslegung bitte gegen das Originalwerk prüfen.
 */
export interface RauheitEintrag {
  id: string
  werkstoff: string
  kMinMm: number
  kTypMm: number
  kMaxMm: number
}

export const rauheitsQuelle: Quelle = {
  werk: 'Sigloch, Technische Fluidmechanik; Bohl/Elmendorf, Technische Strömungslehre',
  unsicher: true,
}

export const rauheitstabelle: RauheitEintrag[] = [
  { id: 'edelstahl-gezogen', werkstoff: 'Edelstahl, gezogen', kMinMm: 0.001, kTypMm: 0.0015, kMaxMm: 0.002 },
  { id: 'stahl-neu', werkstoff: 'Stahl, neu (nahtlos gezogen)', kMinMm: 0.02, kTypMm: 0.05, kMaxMm: 0.06 },
  { id: 'stahl-angerostet', werkstoff: 'Stahl, leicht angerostet', kMinMm: 0.1, kTypMm: 0.15, kMaxMm: 0.2 },
  { id: 'kunststoff', werkstoff: 'Kunststoff (PVC, PE)', kMinMm: 0.0015, kTypMm: 0.003, kMaxMm: 0.007 },
  { id: 'glas', werkstoff: 'Glas', kMinMm: 0.0013, kTypMm: 0.0015, kMaxMm: 0.003 },
]

export function rauheitTypInMeter(id: string): number {
  const eintrag = rauheitstabelle.find((r) => r.id === id)
  if (!eintrag) throw new Error(`Unbekannter Werkstoff "${id}"`)
  return eintrag.kTypMm * 1e-3
}
