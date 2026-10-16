import type { Formula } from '../../types/formula'

export const waermetauscherGrob: Formula = {
  id: 'waermetauscher-grob',
  name: 'Wärmetauscher, Grobauslegung',
  kategorie: 'Wärmeübertragung',
  stichworte: ['wärmetauscher', 'auslegung', 'fläche', 'k-wert'],
  latex: '\\dot{Q} = k \\cdot A \\cdot \\Delta T_m',
  variablen: [
    { id: 'Q_dot', symbol: '\\dot{Q}', name: 'Wärmestrom', dimension: 'power', defaultUnit: 'kW' },
    { id: 'k', symbol: 'k', name: 'Wärmedurchgangskoeffizient', dimension: 'heatTransferCoefficient', defaultUnit: 'Wm2K' },
    { id: 'A', symbol: 'A', name: 'Austauschfläche', dimension: 'area', defaultUnit: 'm2' },
    { id: 'dTm', symbol: '\\Delta T_m', name: 'Mittlere log. Temperaturdifferenz', dimension: 'temperatureDelta', defaultUnit: 'K' },
  ],
  zielgroessen: ['Q_dot', 'A', 'k'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (bekannt.dTm <= 0) throw new Error('Mittlere Temperaturdifferenz muss größer 0 sein')
    if (ziel === 'Q_dot') return { Q_dot: bekannt.k * bekannt.A * bekannt.dTm }
    if (ziel === 'A') {
      if (bekannt.k <= 0) throw new Error('k muss größer 0 sein')
      return { A: bekannt.Q_dot / (bekannt.k * bekannt.dTm) }
    }
    if (ziel === 'k') {
      if (bekannt.A <= 0) throw new Error('Fläche muss größer 0 sein')
      return { k: bekannt.Q_dot / (bekannt.A * bekannt.dTm) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Grobauslegung, k über die Fläche als konstant angenommen - keine Ersatzrechnung für eine detaillierte Wärmetauscherauslegung',
  annahmen: ['k-Wert über die gesamte Austauschfläche konstant', 'ΔT_m z. B. aus der LMTD-Formel'],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Grundgleichung des Wärmedurchgangs' },
  beispiel: {
    // k=500 W/(m²K), A=5 m², ΔTm=30K -> Q̇=500*5*30=75000 W
    bekannt: { k: 500, A: 5, dTm: 30 },
    ziel: 'Q_dot',
    erwartet: { Q_dot: 75000 },
    toleranzRelativ: 1e-9,
  },
}
