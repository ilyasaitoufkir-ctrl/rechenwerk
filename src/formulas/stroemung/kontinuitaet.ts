import type { Formula } from '../../types/formula'

export const kontinuitaet: Formula = {
  id: 'kontinuitaet',
  name: 'Kontinuitätsgleichung',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['kontinuität', 'volumenstrom', 'querschnitt', 'geschwindigkeit', 'durchfluss'],
  latex: '\\dot{V} = A \\cdot v',
  variablen: [
    {
      id: 'V_dot',
      symbol: '\\dot{V}',
      name: 'Volumenstrom',
      dimension: 'volumeFlow',
      defaultUnit: 'm3h',
    },
    { id: 'A', symbol: 'A', name: 'Querschnittsfläche', dimension: 'area', defaultUnit: 'cm2' },
    {
      id: 'v',
      symbol: 'v',
      name: 'Strömungsgeschwindigkeit',
      dimension: 'velocity',
      defaultUnit: 'ms',
    },
  ],
  zielgroessen: ['V_dot', 'A', 'v'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'V_dot') {
      return { V_dot: bekannt.A * bekannt.v }
    }
    if (ziel === 'A') {
      if (bekannt.v === 0) throw new Error('Geschwindigkeit darf nicht 0 sein')
      return { A: bekannt.V_dot / bekannt.v }
    }
    if (ziel === 'v') {
      if (bekannt.A === 0) throw new Error('Fläche darf nicht 0 sein')
      return { v: bekannt.V_dot / bekannt.A }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Stationäre, inkompressible Strömung durch einen festen Querschnitt',
  annahmen: ['Dichte entlang der Stromröhre konstant', 'Kein Massenaufbau/-abbau im Kontrollvolumen'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik', kapitel: 'Kontinuitätsgleichung' },
  warnungen: (_bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    const v = ziel === 'v' ? ergebnis.v : undefined
    if (v !== undefined && v > 10) {
      warnungen.push(
        `Geschwindigkeit ${v.toFixed(2)} m/s ist ungewöhnlich hoch für Flüssigkeiten - Eingabe prüfen.`,
      )
    }
    if (v !== undefined && v < 0) {
      warnungen.push('Negative Geschwindigkeit ist physikalisch nicht sinnvoll.')
    }
    return warnungen
  },
  beispiel: {
    bekannt: { A: 0.00785398, v: 2 },
    ziel: 'V_dot',
    erwartet: { V_dot: 0.0157079633 },
    toleranzRelativ: 1e-6,
  },
}
