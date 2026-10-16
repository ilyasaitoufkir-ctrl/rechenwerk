import type { Formula } from '../../types/formula'

export const fuehlbareWaermeLeistung: Formula = {
  id: 'fuehlbare-waerme-leistung',
  name: 'Fühlbare Wärme (Wärmestrom)',
  kategorie: 'Wärmeübertragung',
  stichworte: ['wärmestrom', 'leistung', 'durchlauferhitzer', 'aufheizen', 'cp'],
  latex: '\\dot{Q} = \\dot{m} \\cdot c_p \\cdot \\Delta T',
  variablen: [
    { id: 'Q_dot', symbol: '\\dot{Q}', name: 'Wärmestrom', dimension: 'power', defaultUnit: 'kW' },
    { id: 'm_dot', symbol: '\\dot{m}', name: 'Massenstrom', dimension: 'massFlow', defaultUnit: 'kgh' },
    {
      id: 'cp',
      symbol: 'c_p',
      name: 'Spez. Wärmekapazität',
      dimension: 'specificHeatCapacity',
      defaultUnit: 'JkgK',
    },
    { id: 'dT', symbol: '\\Delta T', name: 'Temperaturänderung', dimension: 'temperatureDelta', defaultUnit: 'K' },
  ],
  zielgroessen: ['Q_dot', 'm_dot', 'cp', 'dT'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'Q_dot') return { Q_dot: bekannt.m_dot * bekannt.cp * bekannt.dT }
    if (ziel === 'm_dot') {
      if (bekannt.cp * bekannt.dT === 0) throw new Error('c_p · ΔT darf nicht 0 sein')
      return { m_dot: bekannt.Q_dot / (bekannt.cp * bekannt.dT) }
    }
    if (ziel === 'cp') {
      if (bekannt.m_dot * bekannt.dT === 0) throw new Error('ṁ · ΔT darf nicht 0 sein')
      return { cp: bekannt.Q_dot / (bekannt.m_dot * bekannt.dT) }
    }
    if (ziel === 'dT') {
      if (bekannt.m_dot * bekannt.cp === 0) throw new Error('ṁ · c_p darf nicht 0 sein')
      return { dT: bekannt.Q_dot / (bekannt.m_dot * bekannt.cp) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Stationärer Massenstrom, fühlbare Wärme ohne Phasenwechsel, c_p konstant angenommen',
  annahmen: ['Stationärer Betrieb', 'Keine Phasenumwandlung im betrachteten Bereich', 'c_p temperaturunabhängig'],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Kalorische Zustandsgrößen' },
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.m_dot < 0) warnungen.push('Negativer Massenstrom ist nicht sinnvoll.')
    return warnungen
  },
  beispiel: {
    // ṁ=0,5 kg/s, cp=4182 J/(kg·K), ΔT=40K -> Q̇=0,5*4182*40=83640 W
    bekannt: { m_dot: 0.5, cp: 4182, dT: 40 },
    ziel: 'Q_dot',
    erwartet: { Q_dot: 83640 },
    toleranzRelativ: 1e-9,
  },
}
