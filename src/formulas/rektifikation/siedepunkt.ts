import type { Formula } from '../../types/formula'
import { siedepunkt as berechneSiedepunkt } from '../../lib/antoine'

export const siedepunkt: Formula = {
  id: 'siedepunkt',
  name: 'Siedepunkt (Bubble Point)',
  kategorie: 'Rektifikation',
  stichworte: ['siedepunkt', 'bubble point', 'antoine', 'binäres gemisch'],
  latex: 'x_1 \\, p_{1,sat}(T) + x_2 \\, p_{2,sat}(T) = P',
  variablen: [
    { id: 'A1', symbol: 'A_1', name: 'Antoine-Koeffizient A, Komponente 1', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'B1', symbol: 'B_1', name: 'Antoine-Koeffizient B, Komponente 1', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'C1', symbol: 'C_1', name: 'Antoine-Koeffizient C, Komponente 1', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'A2', symbol: 'A_2', name: 'Antoine-Koeffizient A, Komponente 2', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'B2', symbol: 'B_2', name: 'Antoine-Koeffizient B, Komponente 2', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'C2', symbol: 'C_2', name: 'Antoine-Koeffizient C, Komponente 2', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'basis', symbol: 'Basis', name: 'Logarithmusbasis', dimension: 'dimensionless', defaultUnit: '_', min: 1.0001, hinweis: '10 für log10, 2,718281828 für ln' },
    { id: 'x1', symbol: 'x_1', name: 'Molanteil Komponente 1 (Flüssigkeit)', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'P', symbol: 'P', name: 'Gesamtdruck (gemäß Antoine-Konvention)', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'T', symbol: 'T', name: 'Siedetemperatur (gemäß Antoine-Konvention)', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['T'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'T') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const T = berechneSiedepunkt(
      { A: bekannt.A1, B: bekannt.B1, C: bekannt.C1 },
      { A: bekannt.A2, B: bekannt.B2, C: bekannt.C2 },
      bekannt.basis,
      bekannt.x1,
      bekannt.P,
    )
    return { T }
  },
  gueltigkeit: 'Ideales binäres Gemisch (Raoult), numerisch per Bisektion im Bereich -200 bis 2000 (Temperatureinheit der Koeffizienten) gelöst',
  annahmen: [
    'Ideales Gemisch (Raoult’sches Gesetz, keine Aktivitätskoeffizienten)',
    'Alle Größen in der Einheitenkonvention der eingegebenen Antoine-Koeffizienten, keine automatische Umrechnung',
  ],
  quelle: { werk: 'Raoult’sches Gesetz, Standardform der thermischen Verfahrenstechnik' },
  beispiel: {
    // Ethanol(1)/Wasser(2), log10, p in mmHg, T in °C, x1=0,5, P=760 mmHg
    bekannt: { A1: 8.20417, B1: 1642.89, C1: 230.3, A2: 8.07131, B2: 1730.63, C2: 233.426, basis: 10, x1: 0.5, P: 760 },
    ziel: 'T',
    erwartet: { T: 86.81288858219571 },
    toleranzRelativ: 1e-5,
  },
}
