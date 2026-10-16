import type { Formula } from '../../types/formula'

export const mischungMassenbilanz: Formula = {
  id: 'mischung-massenbilanz',
  name: 'Mischung, Massenbilanz',
  kategorie: 'Dosierung & Mischen',
  stichworte: ['mischung', 'massenbilanz', 'konzentration', 'komponenten'],
  latex: 'w_{Mix} = \\dfrac{\\sum m_i \\cdot w_i}{\\sum m_i}',
  variablen: [
    { id: 'summeM', symbol: '\\sum m_i', name: 'Summe Massen', dimension: 'mass', defaultUnit: 'kg' },
    { id: 'summeMW', symbol: '\\sum m_i w_i', name: 'Summe Masse·Anteil', dimension: 'mass', defaultUnit: 'kg' },
    { id: 'wMix', symbol: 'w_{Mix}', name: 'Mischungsanteil', dimension: 'dimensionless', defaultUnit: 'pct' },
  ],
  zielgroessen: ['wMix'],
  komponentenfeld: {
    spalten: [
      { id: 'm', name: 'Masse', dimension: 'mass', defaultUnit: 'kg' },
      { id: 'w', name: 'Massenanteil', dimension: 'dimensionless', defaultUnit: 'pct' },
    ],
    summen: [
      { zielVariable: 'summeM', spalten: ['m'] },
      { zielVariable: 'summeMW', spalten: ['m', 'w'] },
    ],
  },
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'wMix') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.summeM <= 0) throw new Error('Summe der Massen muss größer 0 sein')
    return { wMix: bekannt.summeMW / bekannt.summeM }
  },
  gueltigkeit: 'Mischen von beliebig vielen Komponenten ohne chemische Reaktion oder Volumenkontraktion',
  annahmen: ['Massenanteile w_i beziehen sich auf denselben Bezugsstoff', 'Keine Reaktion zwischen den Komponenten'],
  quelle: { werk: 'Eigene Herleitung aus der Massenbilanz' },
  beispiel: {
    // Komponente 1: 70 kg mit w=0,10 ; Komponente 2: 30 kg mit w=0,40
    // Σm=100, Σmw=70*0,1+30*0,4=7+12=19 -> wMix=0,19
    bekannt: { summeM: 100, summeMW: 19 },
    ziel: 'wMix',
    erwartet: { wMix: 0.19 },
    toleranzRelativ: 1e-9,
  },
}
