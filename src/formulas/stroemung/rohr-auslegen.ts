import type { Formula } from '../../types/formula'
import { naechsteNennweite } from '../../data/pipes-din11850'

export const rohrAuslegen: Formula = {
  id: 'rohr-auslegen',
  name: 'Rohrdurchmesser auslegen',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['rohr', 'durchmesser', 'auslegung', 'nennweite', 'dn'],
  latex: 'd = \\sqrt{\\dfrac{4 \\dot{V}}{\\pi \\, v}}',
  variablen: [
    {
      id: 'V_dot',
      symbol: '\\dot{V}',
      name: 'Volumenstrom',
      dimension: 'volumeFlow',
      defaultUnit: 'm3h',
    },
    {
      id: 'v',
      symbol: 'v',
      name: 'Auslegungsgeschwindigkeit',
      dimension: 'velocity',
      defaultUnit: 'ms',
      hinweis:
        'Richtwerte: Flüssigkeiten Saugseite ca. 0,5-1 m/s, Druckseite ca. 1,5-3 m/s (Dubbel, Taschenbuch für den Maschinenbau)',
    },
    { id: 'd', symbol: 'd', name: 'Innendurchmesser', dimension: 'length', defaultUnit: 'mm' },
  ],
  zielgroessen: ['d'],
  compute: (bekannt, ziel) => {
    if (ziel !== 'd') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.v <= 0) throw new Error('Geschwindigkeit muss größer 0 sein')
    return { d: Math.sqrt((4 * bekannt.V_dot) / (Math.PI * bekannt.v)) }
  },
  gueltigkeit: 'Kreisrunder Querschnitt, stationäre inkompressible Strömung',
  annahmen: ['Kreisrunder Vollquerschnitt', 'Auslegungsgeschwindigkeit ist vorab festgelegt'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', unsicher: true },
  richtwert: true,
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.v > 5) {
      warnungen.push(
        `Auslegungsgeschwindigkeit ${bekannt.v.toFixed(2)} m/s liegt deutlich über typischen Richtwerten für Flüssigkeiten.`,
      )
    }
    return warnungen
  },
  empfehlung: (ergebnis) => {
    const naechste = naechsteNennweite(ergebnis.d)
    if (!naechste) return undefined
    return `Nächstgrößere Nennweite (DIN 11850 Reihe 2): DN ${naechste.dn} (Innendurchmesser ${naechste.innenDurchmesserMm} mm)`
  },
  beispiel: {
    bekannt: { V_dot: 0.0157079633, v: 2 },
    ziel: 'd',
    erwartet: { d: 0.1 },
    toleranzRelativ: 1e-6,
  },
}
