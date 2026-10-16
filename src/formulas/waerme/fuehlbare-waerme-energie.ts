import type { Formula } from '../../types/formula'

export const fuehlbareWaermeEnergie: Formula = {
  id: 'fuehlbare-waerme-energie',
  name: 'Fühlbare Wärme (Energie)',
  kategorie: 'Wärmeübertragung',
  stichworte: ['wärmemenge', 'energie', 'aufheizen', 'erwärmen', 'cp'],
  latex: 'Q = m \\cdot c_p \\cdot \\Delta T',
  variablen: [
    { id: 'Q', symbol: 'Q', name: 'Wärmemenge', dimension: 'energy', defaultUnit: 'kJ' },
    { id: 'm', symbol: 'm', name: 'Masse', dimension: 'mass', defaultUnit: 'kg' },
    {
      id: 'cp',
      symbol: 'c_p',
      name: 'Spez. Wärmekapazität',
      dimension: 'specificHeatCapacity',
      defaultUnit: 'JkgK',
    },
    { id: 'dT', symbol: '\\Delta T', name: 'Temperaturänderung', dimension: 'temperatureDelta', defaultUnit: 'K' },
  ],
  zielgroessen: ['Q', 'm', 'cp', 'dT'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'Q') return { Q: bekannt.m * bekannt.cp * bekannt.dT }
    if (ziel === 'm') {
      if (bekannt.cp * bekannt.dT === 0) throw new Error('c_p · ΔT darf nicht 0 sein')
      return { m: bekannt.Q / (bekannt.cp * bekannt.dT) }
    }
    if (ziel === 'cp') {
      if (bekannt.m * bekannt.dT === 0) throw new Error('m · ΔT darf nicht 0 sein')
      return { cp: bekannt.Q / (bekannt.m * bekannt.dT) }
    }
    if (ziel === 'dT') {
      if (bekannt.m * bekannt.cp === 0) throw new Error('m · c_p darf nicht 0 sein')
      return { dT: bekannt.Q / (bekannt.m * bekannt.cp) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Fühlbare Wärme ohne Phasenwechsel, c_p im betrachteten Temperaturbereich als konstant angenommen',
  annahmen: ['Keine Phasenumwandlung (Schmelzen, Verdampfen) im betrachteten Bereich', 'c_p temperaturunabhängig'],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Kalorische Zustandsgrößen' },
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.m < 0) warnungen.push('Negative Masse ist nicht sinnvoll.')
    if (bekannt.cp !== undefined && bekannt.cp <= 0) warnungen.push('Spezifische Wärmekapazität muss größer 0 sein.')
    return warnungen
  },
  beispiel: {
    // m=10 kg Wasser, cp=4182 J/(kg·K), ΔT=50K -> Q = 10*4182*50 = 2091000 J
    bekannt: { m: 10, cp: 4182, dT: 50 },
    ziel: 'Q',
    erwartet: { Q: 2091000 },
    toleranzRelativ: 1e-9,
  },
}
