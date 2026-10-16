import type { Quelle } from '../types/formula'

/**
 * Stoffdaten für Wärmeübertragung: Wärmeleitfähigkeit λ, Dichte ρ und
 * spezifische Wärmekapazität c_p bei ca. 20 °C. Durchweg Richtwerte - reale
 * Werte hängen von Legierung, Feuchte, Rohdichte und Temperatur ab.
 *
 * Quelle: VDI Wärmeatlas; Dubbel, Taschenbuch für den Maschinenbau. Genaue
 * Kapitel-/Tabellennummer nicht sicher zuordenbar - vor sicherheitsrelevanter
 * Auslegung gegen das Originalwerk prüfen.
 */
export interface StoffEintrag {
  id: string
  name: string
  lambdaWmK: number
  rhoKgM3: number
  cpJkgK: number
}

export const stoffdatenQuelle: Quelle = {
  werk: 'VDI Wärmeatlas; Dubbel, Taschenbuch für den Maschinenbau',
  unsicher: true,
}

export const stoffdatenWaerme: StoffEintrag[] = [
  { id: 'stahl', name: 'Stahl, unlegiert', lambdaWmK: 50, rhoKgM3: 7850, cpJkgK: 490 },
  { id: 'edelstahl', name: 'Edelstahl (V2A/V4A)', lambdaWmK: 15, rhoKgM3: 7900, cpJkgK: 500 },
  { id: 'kupfer', name: 'Kupfer', lambdaWmK: 380, rhoKgM3: 8900, cpJkgK: 390 },
  { id: 'aluminium', name: 'Aluminium', lambdaWmK: 220, rhoKgM3: 2700, cpJkgK: 900 },
  { id: 'beton', name: 'Beton', lambdaWmK: 1.8, rhoKgM3: 2300, cpJkgK: 900 },
  { id: 'ziegel', name: 'Ziegelmauerwerk', lambdaWmK: 0.6, rhoKgM3: 1600, cpJkgK: 900 },
  { id: 'mineralwolle', name: 'Mineralwolle (Dämmung)', lambdaWmK: 0.04, rhoKgM3: 50, cpJkgK: 840 },
  { id: 'pur-schaum', name: 'PUR-Hartschaum (Dämmung)', lambdaWmK: 0.025, rhoKgM3: 35, cpJkgK: 1450 },
  { id: 'luft', name: 'Luft, ruhend (20 °C)', lambdaWmK: 0.026, rhoKgM3: 1.2, cpJkgK: 1005 },
  { id: 'wasser', name: 'Wasser (20 °C)', lambdaWmK: 0.6, rhoKgM3: 998, cpJkgK: 4182 },
]
