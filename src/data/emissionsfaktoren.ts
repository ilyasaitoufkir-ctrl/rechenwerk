import type { Quelle } from '../types/formula'

/**
 * CO2-Emissionsfaktoren gängiger Energieträger, bezogen auf den Heizwert
 * (Hi). Diese Werte ändern sich jährlich (v. a. beim Strommix) und je nach
 * Methodik (UBA, GEMIS, DIN V 18599) - unbedingt gegen eine aktuelle Quelle
 * prüfen, bevor sie für eine Bilanzierung verwendet werden. Deshalb
 * durchweg als Richtwert UND mit unsicherer Quelle markiert; im Rechner
 * frei überschreibbar.
 */
export interface EmissionsfaktorEintrag {
  id: string
  energietraeger: string
  faktorKgKWh: number
  bezug: 'Heizwert' | 'Strommix'
}

export const emissionsfaktorenQuelle: Quelle = {
  werk: 'Umweltbundesamt (UBA), Richtwerte - jährlich aktualisiert, hier nicht verifiziert',
  unsicher: true,
}

export const emissionsfaktoren: EmissionsfaktorEintrag[] = [
  { id: 'erdgas', energietraeger: 'Erdgas', faktorKgKWh: 0.201, bezug: 'Heizwert' },
  { id: 'heizoel', energietraeger: 'Heizöl EL', faktorKgKWh: 0.266, bezug: 'Heizwert' },
  { id: 'fluessiggas', energietraeger: 'Flüssiggas (Propan/Butan)', faktorKgKWh: 0.234, bezug: 'Heizwert' },
  { id: 'steinkohle', energietraeger: 'Steinkohle', faktorKgKWh: 0.335, bezug: 'Heizwert' },
  { id: 'braunkohle', energietraeger: 'Braunkohle', faktorKgKWh: 0.399, bezug: 'Heizwert' },
  { id: 'strom-de', energietraeger: 'Strom, deutscher Mix', faktorKgKWh: 0.38, bezug: 'Strommix' },
  { id: 'fernwaerme', energietraeger: 'Fernwärme, Durchschnitt', faktorKgKWh: 0.25, bezug: 'Strommix' },
]
