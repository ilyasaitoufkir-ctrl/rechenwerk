import type { Formula } from '../../types/formula'
import { gleichgewichtY, gleichgewichtX } from '../../lib/rektifikation'

export const gleichgewichtskurve: Formula = {
  id: 'gleichgewichtskurve',
  name: 'Gleichgewichtskurve (relative Flüchtigkeit)',
  kategorie: 'Rektifikation',
  stichworte: ['gleichgewichtskurve', 'relative flüchtigkeit', 'alpha', 'dampf-flüssig-gleichgewicht'],
  latex: 'y = \\dfrac{\\alpha \\, x}{1 + (\\alpha - 1) x}',
  variablen: [
    { id: 'alpha', symbol: '\\alpha', name: 'Relative Flüchtigkeit', dimension: 'dimensionless', defaultUnit: '_', min: 0 },
    { id: 'x', symbol: 'x', name: 'Molanteil Flüssigkeit (leichter siedende Komponente)', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'y', symbol: 'y', name: 'Molanteil Dampf (leichter siedende Komponente)', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
  ],
  zielgroessen: ['y', 'x', 'alpha'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'y') return { y: gleichgewichtY(bekannt.x, bekannt.alpha) }
    if (ziel === 'x') return { x: gleichgewichtX(bekannt.y, bekannt.alpha) }
    if (ziel === 'alpha') {
      const { x, y } = bekannt
      if (x <= 0 || x >= 1 || y <= 0 || y >= 1) throw new Error('x und y müssen zwischen 0 und 1 liegen')
      const nenner = x * (1 - y)
      if (Math.abs(nenner) < 1e-12) throw new Error('α nicht bestimmbar (Nenner 0)')
      return { alpha: (y * (1 - x)) / nenner }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Binäres Gemisch, relative Flüchtigkeit α über den betrachteten Zusammensetzungsbereich als konstant angenommen',
  annahmen: ['α über den Konzentrationsbereich konstant (für ideale oder nahezu ideale Gemische über begrenzte Bereiche üblich)'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik; Standardwerke der thermischen Verfahrenstechnik' },
  beispiel: {
    // α=2, x=0,3 -> y = 2*0,3/(1+1*0,3) = 0,6/1,3 = 0,461538
    bekannt: { alpha: 2, x: 0.3 },
    ziel: 'y',
    erwartet: { y: 0.461538 },
    toleranzRelativ: 1e-5,
  },
}
