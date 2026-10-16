import type { Quelle } from '../types/formula'

/**
 * Dichten gängiger Behälter-/Blechwerkstoffe. Richtwerte - reale Dichten
 * hängen von Legierungszusammensetzung, Füllstoffen (bei Kunststoffen) und
 * Temperatur ab.
 *
 * Quelle: Dubbel, Taschenbuch für den Maschinenbau; VDI Wärmeatlas. Genaue
 * Kapitel-/Tabellennummer nicht sicher zuordenbar.
 */
export interface WerkstoffEintrag {
  id: string
  name: string
  rhoKgM3: number
}

export const werkstoffdichtenQuelle: Quelle = {
  werk: 'Dubbel, Taschenbuch für den Maschinenbau',
  unsicher: true,
}

export const werkstoffdichten: WerkstoffEintrag[] = [
  { id: '1.4301', name: 'Edelstahl 1.4301 (V2A)', rhoKgM3: 7900 },
  { id: '1.4404', name: 'Edelstahl 1.4404 (V4A)', rhoKgM3: 7990 },
  { id: 'stahl', name: 'Stahl, unlegiert', rhoKgM3: 7850 },
  { id: 'aluminium', name: 'Aluminium', rhoKgM3: 2700 },
  { id: 'pp', name: 'Polypropylen (PP)', rhoKgM3: 905 },
  { id: 'pe', name: 'Polyethylen (PE)', rhoKgM3: 950 },
  { id: 'pvc', name: 'Hart-PVC', rhoKgM3: 1400 },
]
