import type { Quelle } from '../types/formula'

/**
 * Widerstandsbeiwerte ζ typischer Einbauten für Darcy-Weisbach (Σζ).
 * Durchweg Richtwerte - reale Werte hängen stark von Bauart und Hersteller
 * ab und können erheblich abweichen. "typ" ist ein praxisüblicher Mittelwert.
 *
 * Quelle: Bohl/Elmendorf, Technische Strömungslehre; Sigloch, Technische
 * Fluidmechanik (Tabellen zu Einzelwiderständen). Genaue Kapitel-/
 * Tabellennummer nicht sicher zuordenbar - quelleUnsicher = true.
 */
export interface EinbauEintrag {
  id: string
  name: string
  zetaMin: number
  zetaTyp: number
  zetaMax: number
}

export const fittingsQuelle: Quelle = {
  werk: 'Bohl/Elmendorf, Technische Strömungslehre; Sigloch, Technische Fluidmechanik',
  unsicher: true,
}

export const einbauten: EinbauEintrag[] = [
  { id: 'bogen-90-scharf', name: 'Rohrbogen 90°, scharfkantig', zetaMin: 1.1, zetaTyp: 1.2, zetaMax: 1.3 },
  { id: 'bogen-90-gerundet', name: 'Rohrbogen 90°, gerundet', zetaMin: 0.2, zetaTyp: 0.3, zetaMax: 0.5 },
  { id: 'bogen-45', name: 'Rohrbogen 45°', zetaMin: 0.15, zetaTyp: 0.2, zetaMax: 0.3 },
  { id: 't-stueck-durchgang', name: 'T-Stück, Durchgang', zetaMin: 0.1, zetaTyp: 0.15, zetaMax: 0.2 },
  { id: 't-stueck-abzweig', name: 'T-Stück, Abzweig', zetaMin: 1.0, zetaTyp: 1.3, zetaMax: 1.5 },
  { id: 'rueckschlagventil', name: 'Rückschlagventil', zetaMin: 2, zetaTyp: 3, zetaMax: 4 },
  { id: 'kugelhahn-offen', name: 'Kugelhahn, voll offen', zetaMin: 0.03, zetaTyp: 0.05, zetaMax: 0.1 },
  { id: 'schieber-offen', name: 'Schieber, voll offen', zetaMin: 0.1, zetaTyp: 0.15, zetaMax: 0.2 },
  { id: 'einlauf-scharf', name: 'Einlauf, scharfkantig', zetaMin: 0.4, zetaTyp: 0.5, zetaMax: 0.6 },
  { id: 'einlauf-gerundet', name: 'Einlauf, gut gerundet', zetaMin: 0.03, zetaTyp: 0.04, zetaMax: 0.1 },
  { id: 'auslauf', name: 'Auslauf in Behälter', zetaMin: 0.9, zetaTyp: 1.0, zetaMax: 1.0 },
]
