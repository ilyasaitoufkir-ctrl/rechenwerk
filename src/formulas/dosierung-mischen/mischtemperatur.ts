import type { Formula } from '../../types/formula'

export const mischtemperatur: Formula = {
  id: 'mischtemperatur',
  name: 'Mischtemperatur',
  kategorie: 'Dosierung & Mischen',
  stichworte: ['mischtemperatur', 'mischung', 'wärmebilanz', 'temperaturausgleich'],
  latex: 'T_M = \\dfrac{\\sum m_i \\cdot c_i \\cdot T_i}{\\sum m_i \\cdot c_i}',
  variablen: [
    { id: 'summeMC', symbol: '\\sum m_i c_i', name: 'Summe Masse·Wärmekapazität', dimension: 'specificHeatCapacity', defaultUnit: 'JkgK' },
    { id: 'summeMCT', symbol: '\\sum m_i c_i T_i', name: 'Summe Masse·Wärmekapazität·Temperatur', dimension: 'energy', defaultUnit: 'J' },
    { id: 'TM', symbol: 'T_M', name: 'Mischtemperatur', dimension: 'temperature', defaultUnit: 'C' },
  ],
  zielgroessen: ['TM'],
  komponentenfeld: {
    spalten: [
      { id: 'm', name: 'Masse', dimension: 'mass', defaultUnit: 'kg' },
      { id: 'c', name: 'Spez. Wärmekapazität', dimension: 'specificHeatCapacity', defaultUnit: 'JkgK' },
      { id: 'T', name: 'Temperatur', dimension: 'temperature', defaultUnit: 'C' },
    ],
    summen: [
      { zielVariable: 'summeMC', spalten: ['m', 'c'] },
      { zielVariable: 'summeMCT', spalten: ['m', 'c', 'T'] },
    ],
  },
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'TM') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.summeMC <= 0) throw new Error('Summe Masse·Wärmekapazität muss größer 0 sein')
    return { TM: bekannt.summeMCT / bekannt.summeMC }
  },
  gueltigkeit: 'Mischen mehrerer Massenströme/-mengen ohne Phasenwechsel und ohne chemische Reaktion',
  annahmen: [
    'Keine Phasenumwandlung beim Mischen',
    'Spezifische Wärmekapazität je Komponente im betrachteten Temperaturbereich konstant',
    'Keine Wärmeverluste an die Umgebung während des Mischens',
  ],
  quelle: { werk: 'VDI Wärmeatlas' },
  beispiel: {
    // Komponente 1: 10 kg, c=4182 J/(kgK), T=80°C=353,15K
    // Komponente 2: 20 kg, c=4182 J/(kgK), T=20°C=293,15K
    // ΣmC = 10*4182+20*4182 = 125460
    // ΣmCT = 10*4182*353,15 + 20*4182*293,15 = 14768733 + 24519066 = 39287799
    // TM = 39287799/125460 = 313,15 K = 40°C (Kontrolle: gewichteter Mittelwert 10/30*80+20/30*20=40)
    bekannt: { summeMC: 125460, summeMCT: 39287799 },
    ziel: 'TM',
    erwartet: { TM: 313.15 },
    toleranzRelativ: 1e-6,
  },
}
