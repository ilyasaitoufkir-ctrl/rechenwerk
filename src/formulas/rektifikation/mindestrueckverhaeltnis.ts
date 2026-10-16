import type { Formula } from '../../types/formula'
import { mindestrueckverhaeltnis as berechneRmin, schnittQLinieGleichgewicht } from '../../lib/rektifikation'

export const mindestrueckverhaeltnis: Formula = {
  id: 'mindestrueckverhaeltnis',
  name: 'Mindestrücklaufverhältnis',
  kategorie: 'Rektifikation',
  stichworte: ['mindestrücklaufverhältnis', 'rmin', 'q-gerade', 'pinch'],
  latex: 'R_{min} = \\dfrac{x_D - y^*}{y^* - x^*}',
  variablen: [
    { id: 'alpha', symbol: '\\alpha', name: 'Relative Flüchtigkeit', dimension: 'dimensionless', defaultUnit: '_', min: 1.0001 },
    { id: 'xF', symbol: 'x_F', name: 'Zulaufzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'xD', symbol: 'x_D', name: 'Destillatzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    {
      id: 'q',
      symbol: 'q',
      name: 'Wärmezustand des Zulaufs (q)',
      dimension: 'dimensionless',
      defaultUnit: '_',
      hinweis: 'q=1 siedender Zulauf, q=0 gesättigter Dampf, q>1 unterkühlte Flüssigkeit, 0<q<1 Dampf-Flüssig-Gemisch',
    },
    { id: 'Rmin', symbol: 'R_{min}', name: 'Mindestrücklaufverhältnis', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'xStern', symbol: 'x^*', name: 'x* (Schnittpunkt q-Linie/Gleichgewichtskurve)', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'yStern', symbol: 'y^*', name: 'y* (Schnittpunkt q-Linie/Gleichgewichtskurve)', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['Rmin'],
  zusatzAusgaben: ['xStern', 'yStern'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'Rmin') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const schnitt = schnittQLinieGleichgewicht(bekannt.alpha, bekannt.xF, bekannt.q)
    const Rmin = berechneRmin(bekannt.alpha, bekannt.xF, bekannt.xD, bekannt.q)
    return { Rmin, xStern: schnitt.x, yStern: schnitt.y }
  },
  gueltigkeit: 'Binäres Gemisch, konstante relative Flüchtigkeit, idealer (gerader) q-Linien-Ansatz',
  annahmen: ['α über den Kolonnenbereich konstant', 'Schnittpunkt q-Linie/Gleichgewichtskurve numerisch per Bisektion bestimmt (außer q=1, dort direkt)'],
  quelle: { werk: 'McCabe-Thiele-Verfahren, Standardwerke der thermischen Verfahrenstechnik' },
  warnungen: (_bekannt, _ziel, ergebnis) => {
    const warnungen: string[] = []
    if (ergebnis.Rmin <= 0) warnungen.push('R_min ≤ 0 - Eingaben prüfen (x_F, x_D, q).')
    return warnungen
  },
  beispiel: {
    // α=2,5, xF=0,5, xD=0,95, q=1 -> y*≈0,714286, Rmin≈1,1
    bekannt: { alpha: 2.5, xF: 0.5, xD: 0.95, q: 1 },
    ziel: 'Rmin',
    erwartet: { Rmin: 1.1, xStern: 0.5, yStern: 0.714286 },
    toleranzRelativ: 1e-4,
  },
}
