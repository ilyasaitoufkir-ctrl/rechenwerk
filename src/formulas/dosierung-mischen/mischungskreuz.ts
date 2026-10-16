import type { Formula } from '../../types/formula'

export const mischungskreuz: Formula = {
  id: 'mischungskreuz',
  name: 'Mischungskreuz',
  kategorie: 'Dosierung & Mischen',
  stichworte: ['mischungskreuz', 'alligation', 'konzentration', 'mischungsregel'],
  latex: '\\dfrac{m_1}{m_2} = \\dfrac{c_2 - c_{Ziel}}{c_{Ziel} - c_1}',
  variablen: [
    { id: 'c1', symbol: 'c_1', name: 'Konzentration Komponente 1 (niedriger)', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'c2', symbol: 'c_2', name: 'Konzentration Komponente 2 (höher)', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'cZiel', symbol: 'c_{Ziel}', name: 'Zielkonzentration', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'mGesamt', symbol: 'm_{ges}', name: 'Zielgesamtmenge', dimension: 'mass', defaultUnit: 'kg' },
    { id: 'm1', symbol: 'm_1', name: 'Menge Komponente 1', dimension: 'mass', defaultUnit: 'kg' },
    { id: 'm2', symbol: 'm_2', name: 'Menge Komponente 2', dimension: 'mass', defaultUnit: 'kg' },
  ],
  zielgroessen: ['m1'],
  zusatzAusgaben: ['m2'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'm1') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const { c1, c2, cZiel, mGesamt } = bekannt
    const zielZwischenC1undC2 = (cZiel - c1) * (cZiel - c2) <= 0 && c1 !== c2
    if (!zielZwischenC1undC2) {
      throw new Error('Die Zielkonzentration muss zwischen c₁ und c₂ liegen')
    }
    const m1 = (mGesamt * (c2 - cZiel)) / (c2 - c1)
    const m2 = mGesamt - m1
    return { m1, m2 }
  },
  gueltigkeit: 'Mischen von zwei Komponenten unterschiedlicher Konzentration zu einer Zielkonzentration (Additivität der Mengen vorausgesetzt)',
  annahmen: ['Keine Volumenkontraktion beim Mischen', 'Konzentrationen beziehen sich auf denselben Bezug (z. B. Massenanteil)'],
  quelle: { werk: 'Eigene Herleitung (klassische Mischungsregel/Alligation)' },
  beispiel: {
    // c1=0,10, c2=0,40, cZiel=0,19, mGesamt=100 kg
    // m1 = 100*(0,40-0,19)/(0,40-0,10) = 100*0,21/0,30 = 70 kg, m2=30 kg
    bekannt: { c1: 0.1, c2: 0.4, cZiel: 0.19, mGesamt: 100 },
    ziel: 'm1',
    erwartet: { m1: 70, m2: 30 },
    toleranzRelativ: 1e-9,
  },
}
