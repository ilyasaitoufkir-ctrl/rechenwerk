import type { Formula } from '../../types/formula'
import { annuitaet as berechneAnnuitaet } from '../../lib/wirtschaftlichkeit'

export const annuitaet: Formula = {
  id: 'annuitaet',
  name: 'Annuität',
  kategorie: 'Energie & Kosten',
  stichworte: ['annuität', 'wirtschaftlichkeit', 'investition', 'kapitalwiedergewinnung'],
  latex: 'a = -I \\cdot \\dfrac{i (1+i)^n}{(1+i)^n - 1} + E',
  variablen: [
    { id: 'I', symbol: 'I', name: 'Investition', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'E', symbol: 'E', name: 'Jährliche Einsparung', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'i', symbol: 'i', name: 'Kalkulationszinssatz', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'n', symbol: 'n', name: 'Nutzungsdauer', dimension: 'time', defaultUnit: 'a' },
    { id: 'a', symbol: 'a', name: 'Annuität', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['a'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'a') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const jahre = bekannt.n / (365.25 * 86400)
    return { a: berechneAnnuitaet(bekannt.I, bekannt.E, bekannt.i, jahre) }
  },
  gueltigkeit: 'Konstante jährliche Einsparung über die gesamte Nutzungsdauer, konstanter Kalkulationszinssatz (VDI-2067-Kurzrechnung)',
  annahmen: ['Jährliche Einsparung konstant', 'Zahlungen jeweils am Jahresende (nachschüssig)'],
  quelle: { werk: 'VDI 2067' },
  beispiel: {
    // Gleiche Daten wie Kapitalwert-Beispiel: Annuität = KW * Kapitalwiedergewinnungsfaktor
    // KWF(5%,6) = 1/5,075692 = 0,1970175 -> a = -20000*0,1970175+5000 = 1059,65
    bekannt: { I: 20000, E: 5000, i: 0.05, n: 6 * 365.25 * 86400 },
    ziel: 'a',
    erwartet: { a: 1059.6506378 },
    toleranzRelativ: 1e-3,
  },
}
