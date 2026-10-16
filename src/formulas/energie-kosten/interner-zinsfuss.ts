import type { Formula } from '../../types/formula'
import { internerZinsfuss as berechneIRR } from '../../lib/wirtschaftlichkeit'

export const internerZinsfuss: Formula = {
  id: 'interner-zinsfuss',
  name: 'Interner Zinsfuß',
  kategorie: 'Energie & Kosten',
  stichworte: ['interner zinsfuß', 'irr', 'wirtschaftlichkeit', 'rendite'],
  latex: 'KW(i^*) = 0',
  variablen: [
    { id: 'I', symbol: 'I', name: 'Investition', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'E', symbol: 'E', name: 'Jährliche Einsparung', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'n', symbol: 'n', name: 'Nutzungsdauer', dimension: 'time', defaultUnit: 'a' },
    { id: 'irr', symbol: 'i^*', name: 'Interner Zinsfuß', dimension: 'dimensionless', defaultUnit: 'pct' },
  ],
  zielgroessen: ['irr'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'irr') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const jahre = bekannt.n / (365.25 * 86400)
    return { irr: berechneIRR(bekannt.I, bekannt.E, jahre) }
  },
  gueltigkeit: 'Konstante jährliche Einsparung über die gesamte Nutzungsdauer. Numerisch per Bisektion gelöst (Abbruch bei |Kapitalwert| < 1e-9 € oder nach 200 Schritten).',
  annahmen: ['Jährliche Einsparung konstant', 'Genau ein Vorzeichenwechsel im Zahlungsstrom (eine Investition, danach nur Einsparungen)'],
  quelle: { werk: 'VDI 2067' },
  beispiel: {
    // Gleiche Daten wie Kapitalwert: Kapitalwert bei diesem Zinssatz muss 0 sein
    bekannt: { I: 20000, E: 5000, n: 6 * 365.25 * 86400 },
    ziel: 'irr',
    erwartet: { irr: 0.12978 },
    toleranzRelativ: 5e-3,
  },
}
