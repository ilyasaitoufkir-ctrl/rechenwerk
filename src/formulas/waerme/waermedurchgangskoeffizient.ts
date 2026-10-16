import type { Formula } from '../../types/formula'

export const waermedurchgangskoeffizient: Formula = {
  id: 'waermedurchgangskoeffizient',
  name: 'Wärmedurchgangskoeffizient, ebene Wand',
  kategorie: 'Wärmeübertragung',
  stichworte: ['wärmedurchgang', 'k-wert', 'u-wert', 'wand', 'übergangskoeffizient'],
  latex: '\\dfrac{1}{k} = \\dfrac{1}{\\alpha_1} + \\sum \\frac{s_i}{\\lambda_i} + \\dfrac{1}{\\alpha_2}',
  variablen: [
    { id: 'alpha1', symbol: '\\alpha_1', name: 'Wärmeübergang Seite 1', dimension: 'heatTransferCoefficient', defaultUnit: 'Wm2K' },
    { id: 'alpha2', symbol: '\\alpha_2', name: 'Wärmeübergang Seite 2', dimension: 'heatTransferCoefficient', defaultUnit: 'Wm2K' },
    {
      id: 'R',
      symbol: '\\sum \\frac{s_i}{\\lambda_i}',
      name: 'Wandschichten',
      dimension: 'thermalResistanceArea',
      defaultUnit: 'm2KW',
    },
    { id: 'k', symbol: 'k', name: 'Wärmedurchgangskoeffizient', dimension: 'heatTransferCoefficient', defaultUnit: 'Wm2K' },
  ],
  zielgroessen: ['k'],
  schichtfeld: { zielVariable: 'R', dickeName: 'Dicke s', leitfaehigkeitName: 'Wärmeleitfähigkeit λ' },
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'k') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.alpha1 <= 0 || bekannt.alpha2 <= 0) {
      throw new Error('Wärmeübergangskoeffizienten müssen größer 0 sein')
    }
    const rGesamt = 1 / bekannt.alpha1 + bekannt.R + 1 / bekannt.alpha2
    return { k: 1 / rGesamt }
  },
  gueltigkeit: 'Ebene Wand zwischen zwei Fluiden, stationärer Zustand',
  annahmen: ['Stationärer Zustand', 'Wärmeübergangskoeffizienten über die Fläche konstant'],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Wärmedurchgang' },
  beispiel: {
    // α1=25, α2=10 W/(m²K), R=0,2 m²K/W (z.B. 100mm Schicht λ=0,5)
    // 1/k = 1/25 + 0,2 + 1/10 = 0,34 -> k = 2,941176 W/(m²K)
    bekannt: { alpha1: 25, alpha2: 10, R: 0.2 },
    ziel: 'k',
    erwartet: { k: 2.941176471 },
    toleranzRelativ: 1e-6,
  },
}
