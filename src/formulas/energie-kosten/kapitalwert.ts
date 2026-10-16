import type { Formula } from '../../types/formula'
import { kapitalwert as berechneKapitalwert } from '../../lib/wirtschaftlichkeit'

export const kapitalwert: Formula = {
  id: 'kapitalwert',
  name: 'Kapitalwert',
  kategorie: 'Energie & Kosten',
  stichworte: ['kapitalwert', 'npv', 'wirtschaftlichkeit', 'investition', 'rentenbarwert'],
  latex: 'KW = -I + E \\cdot \\dfrac{1 - (1+i)^{-n}}{i}',
  variablen: [
    { id: 'I', symbol: 'I', name: 'Investition', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'E', symbol: 'E', name: 'Jährliche Einsparung', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'i', symbol: 'i', name: 'Kalkulationszinssatz', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'n', symbol: 'n', name: 'Nutzungsdauer', dimension: 'time', defaultUnit: 'a' },
    { id: 'KW', symbol: 'KW', name: 'Kapitalwert', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['KW'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'KW') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const jahre = bekannt.n / (365.25 * 86400)
    return { KW: berechneKapitalwert(bekannt.I, bekannt.E, bekannt.i, jahre) }
  },
  gueltigkeit: 'Konstante jährliche Einsparung über die gesamte Nutzungsdauer, konstanter Kalkulationszinssatz (VDI-2067-Kurzrechnung)',
  annahmen: ['Jährliche Einsparung konstant', 'Zahlungen jeweils am Jahresende (nachschüssig)', 'Kein Restwert am Ende der Nutzungsdauer berücksichtigt'],
  quelle: { werk: 'VDI 2067' },
  beispiel: {
    // I=20000€, E=5000€/Jahr, i=5%=0,05, n=6 Jahre
    // Rentenbarwertfaktor=(1-1,05^-6)/0,05=5,075692 -> KW=-20000+5000*5,075692=5378,46
    bekannt: { I: 20000, E: 5000, i: 0.05, n: 6 * 365.25 * 86400 },
    ziel: 'KW',
    erwartet: { KW: 5378.46 },
    toleranzRelativ: 1e-4,
  },
}
