import type { Formula } from '../../types/formula'
import { fenskeMindeststufenzahl as berechneFenske } from '../../lib/rektifikation'

export const fenskeMindeststufenzahl: Formula = {
  id: 'fenske-mindeststufenzahl',
  name: 'Fenske-Mindeststufenzahl',
  kategorie: 'Rektifikation',
  stichworte: ['fenske', 'mindeststufenzahl', 'totaler rücklauf'],
  latex: 'N_{min} = \\dfrac{\\ln\\!\\left[\\dfrac{x_D}{1-x_D} \\cdot \\dfrac{1-x_B}{x_B}\\right]}{\\ln \\alpha}',
  variablen: [
    { id: 'alpha', symbol: '\\alpha', name: 'Relative Flüchtigkeit', dimension: 'dimensionless', defaultUnit: '_', min: 1.0001 },
    { id: 'xD', symbol: 'x_D', name: 'Destillatzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'xB', symbol: 'x_B', name: 'Sumpfzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'Nmin', symbol: 'N_{min}', name: 'Mindeststufenzahl', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['Nmin'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'Nmin') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { Nmin: berechneFenske(bekannt.alpha, bekannt.xD, bekannt.xB) }
  },
  gueltigkeit: 'Binäres (oder pseudobinäres) Gemisch bei totalem Rücklauf, konstante relative Flüchtigkeit',
  annahmen: ['α über den Kolonnenbereich konstant', 'Totaler Rücklauf (keine Produktentnahme)'],
  quelle: { werk: 'Fenske-Gleichung, Standardwerke der thermischen Verfahrenstechnik' },
  beispiel: {
    // α=2,5, xD=0,95, xB=0,05 -> Nmin ≈ 6,426866
    bekannt: { alpha: 2.5, xD: 0.95, xB: 0.05 },
    ziel: 'Nmin',
    erwartet: { Nmin: 6.426866 },
    toleranzRelativ: 1e-5,
  },
}
