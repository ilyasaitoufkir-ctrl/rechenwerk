import type { Formula } from '../../types/formula'
import { gillilandStufenzahl as berechneN } from '../../lib/rektifikation'

export const gillilandStufenzahl: Formula = {
  id: 'gilliland-stufenzahl',
  name: 'Stufenzahl nach Gilliland (Eduljee)',
  kategorie: 'Rektifikation',
  stichworte: ['gilliland', 'eduljee', 'stufenzahl', 'korrelation'],
  latex: 'Y = 0{,}75 \\left(1 - X^{0{,}5668}\\right), \\quad X = \\dfrac{R - R_{min}}{R+1}, \\quad Y = \\dfrac{N - N_{min}}{N+1}',
  variablen: [
    { id: 'R', symbol: 'R', name: 'Rücklaufverhältnis', dimension: 'dimensionless', defaultUnit: '_', min: 0 },
    { id: 'Rmin', symbol: 'R_{min}', name: 'Mindestrücklaufverhältnis', dimension: 'dimensionless', defaultUnit: '_', min: 0 },
    { id: 'Nmin', symbol: 'N_{min}', name: 'Mindeststufenzahl (Fenske)', dimension: 'dimensionless', defaultUnit: '_', min: 0 },
    { id: 'N', symbol: 'N', name: 'Theoretische Stufenzahl', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['N'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'N') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { N: berechneN(bekannt.R, bekannt.Rmin, bekannt.Nmin) }
  },
  gueltigkeit: 'Empirische Korrelation, grobe Schätzung der Stufenzahl ohne grafische McCabe-Thiele-Konstruktion. Für eine belastbare Aussage die Konstruktion (siehe Werkzeug "Pumpen-Betriebspunkt"-artige McCabe-Thiele-Seite) verwenden.',
  annahmen: ['Form nach Eduljee (1975), eine von mehreren Gilliland-Näherungen'],
  quelle: { werk: 'Eduljee, Hydrocarbon Processing (1975)', unsicher: true },
  richtwert: true,
  beispiel: {
    // R=2·Rmin=2,2, Rmin=1,1, Nmin=6,426866 -> X=0,34375 -> Y=0,75*(1-0,34375^0,5668)=0,340547 -> N=10,262168
    bekannt: { R: 2.2, Rmin: 1.1, Nmin: 6.426866 },
    ziel: 'N',
    erwartet: { N: 10.262168 },
    toleranzRelativ: 1e-4,
  },
}
