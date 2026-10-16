import type { Formula } from '../../types/formula'
import { G } from '../../units'

export const foerderhoeheMessung: Formula = {
  id: 'foerderhoehe-messung',
  name: 'Förderhöhe aus Messwerten',
  kategorie: 'Pumpen',
  stichworte: ['förderhöhe', 'pumpe', 'messung', 'differenzdruck'],
  latex: 'H = \\dfrac{\\Delta p}{\\rho \\, g} + \\Delta z + \\dfrac{v_2^2 - v_1^2}{2 g}',
  variablen: [
    { id: 'dp', symbol: '\\Delta p', name: 'Differenzdruck (Druck- minus Saugseite)', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    { id: 'dz', symbol: '\\Delta z', name: 'Höhendifferenz Messstellen (druck- minus saugseitig)', dimension: 'length', defaultUnit: 'm' },
    { id: 'v1', symbol: 'v_1', name: 'Geschwindigkeit Saugseite', dimension: 'velocity', defaultUnit: 'ms' },
    { id: 'v2', symbol: 'v_2', name: 'Geschwindigkeit Druckseite', dimension: 'velocity', defaultUnit: 'ms' },
    { id: 'H', symbol: 'H', name: 'Förderhöhe', dimension: 'length', defaultUnit: 'm' },
  ],
  zielgroessen: ['H'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'H') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const H = bekannt.dp / (bekannt.rho * G) + bekannt.dz + (bekannt.v2 ** 2 - bekannt.v1 ** 2) / (2 * G)
    return { H }
  },
  gueltigkeit: 'Förderhöhenbestimmung aus Messungen an Saug- und Druckstutzen derselben Pumpe',
  annahmen: ['Inkompressible Strömung', 'Messstellen nahe genug an den Pumpenstutzen, Verluste dazwischen vernachlässigt'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik; VDI Wärmeatlas' },
  warnungen: (_bekannt, _ziel, ergebnis) => {
    const warnungen: string[] = []
    if (ergebnis.H < 0) warnungen.push('Negative Förderhöhe - Eingaben (insbesondere Vorzeichen von Δp und Δz) prüfen.')
    return warnungen
  },
  beispiel: {
    // Δp=2 bar=200000 Pa, ρ=1000 kg/m³, Δz=1m, v1=1 m/s, v2=2 m/s
    // H = 200000/(1000*9,80665) + 1 + (4-1)/(2*9,80665) = 21,547282 m
    bekannt: { dp: 200000, rho: 1000, dz: 1, v1: 1, v2: 2 },
    ziel: 'H',
    erwartet: { H: 21.547282 },
    toleranzRelativ: 1e-6,
  },
}
