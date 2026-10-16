import type { Formula } from '../../types/formula'
import { antoinePsat } from '../../lib/antoine'

export const dampfdruckAntoine: Formula = {
  id: 'dampfdruck-antoine',
  name: 'Dampfdruck nach Antoine',
  kategorie: 'Rektifikation',
  stichworte: ['antoine', 'dampfdruck', 'raoult', 'sättigungsdruck'],
  latex: '\\log_{Basis}(p) = A - \\dfrac{B}{C + T}',
  variablen: [
    { id: 'A', symbol: 'A', name: 'Koeffizient A', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'B', symbol: 'B', name: 'Koeffizient B', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'C', symbol: 'C', name: 'Koeffizient C', dimension: 'dimensionless', defaultUnit: '_' },
    {
      id: 'T',
      symbol: 'T',
      name: 'Temperatur (gemäß Tabellenkonvention, z. B. °C oder K)',
      dimension: 'dimensionless',
      defaultUnit: '_',
      hinweis: 'Keine automatische Einheitenumrechnung - muss exakt zur Konvention der Koeffizienten A,B,C passen',
    },
    {
      id: 'basis',
      symbol: 'Basis',
      name: 'Logarithmusbasis',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 1.0001,
      hinweis: '10 für log10 (gängigste Konvention), 2,718281828 (e) für ln',
    },
    {
      id: 'p',
      symbol: 'p',
      name: 'Dampfdruck (gemäß Tabellenkonvention, z. B. mmHg, bar, kPa)',
      dimension: 'dimensionless',
      defaultUnit: '_',
    },
  ],
  zielgroessen: ['p'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'p') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { p: antoinePsat(bekannt.A, bekannt.B, bekannt.C, bekannt.T, bekannt.basis) }
  },
  gueltigkeit:
    'Nur im von den Koeffizienten A,B,C abgedeckten Temperaturbereich gültig (siehe Tabellenwerk) - hier nicht automatisch geprüft, da die App die konkrete Quelltabelle nicht kennt.',
  annahmen: [
    'Druck- und Temperatureinheit der Ausgabe entsprechen exakt der Konvention der eingegebenen Koeffizienten - keine automatische Umrechnung, da Tabellenwerke unterschiedliche Konventionen nutzen',
    'Logarithmusbasis muss explizit zur Quelltabelle passen (10 für log10, e für ln)',
  ],
  quelle: { werk: 'Antoine-Gleichung, Standardform der thermischen Verfahrenstechnik' },
  beispiel: {
    // Wasser, log10-Form, p in mmHg, T in °C (klassische Lehrbuchkoeffizienten)
    // A=8,07131, B=1730,63, C=233,426, T=100°C -> p ≈ 760 mmHg
    bekannt: { A: 8.07131, B: 1730.63, C: 233.426, T: 100, basis: 10 },
    ziel: 'p',
    erwartet: { p: 760.0863691649309 },
    toleranzRelativ: 1e-6,
  },
}
