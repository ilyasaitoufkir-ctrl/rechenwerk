import type { Formula } from '../../types/formula'

export const affinitaetsgesetze: Formula = {
  id: 'affinitaetsgesetze',
  name: 'Affinitätsgesetze (Drehzahländerung)',
  kategorie: 'Pumpen',
  stichworte: ['affinitätsgesetze', 'drehzahl', 'kennfeld', 'ähnlichkeitsgesetze'],
  latex: '\\dfrac{\\dot{V}_2}{\\dot{V}_1} = \\dfrac{n_2}{n_1} \\qquad \\dfrac{H_2}{H_1} = \\left(\\dfrac{n_2}{n_1}\\right)^2 \\qquad \\dfrac{P_2}{P_1} = \\left(\\dfrac{n_2}{n_1}\\right)^3',
  variablen: [
    { id: 'n1', symbol: 'n_1', name: 'Drehzahl Ausgangspunkt', dimension: 'frequency', defaultUnit: 'rpm' },
    { id: 'n2', symbol: 'n_2', name: 'Drehzahl Zielpunkt', dimension: 'frequency', defaultUnit: 'rpm' },
    { id: 'V1', symbol: '\\dot{V}_1', name: 'Volumenstrom bei n₁', dimension: 'volumeFlow', defaultUnit: 'm3h' },
    { id: 'H1', symbol: 'H_1', name: 'Förderhöhe bei n₁', dimension: 'length', defaultUnit: 'm' },
    { id: 'P1', symbol: 'P_1', name: 'Leistung bei n₁', dimension: 'power', defaultUnit: 'kW' },
    { id: 'V2', symbol: '\\dot{V}_2', name: 'Volumenstrom bei n₂', dimension: 'volumeFlow', defaultUnit: 'm3h' },
    { id: 'H2', symbol: 'H_2', name: 'Förderhöhe bei n₂', dimension: 'length', defaultUnit: 'm' },
    { id: 'P2', symbol: 'P_2', name: 'Leistung bei n₂', dimension: 'power', defaultUnit: 'kW' },
  ],
  zielgroessen: ['V2'],
  zusatzAusgaben: ['H2', 'P2'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'V2') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.n1 === 0) throw new Error('n₁ darf nicht 0 sein')
    const verhaeltnis = bekannt.n2 / bekannt.n1
    return {
      V2: bekannt.V1 * verhaeltnis,
      H2: bekannt.H1 * verhaeltnis ** 2,
      P2: bekannt.P1 * verhaeltnis ** 3,
    }
  },
  gueltigkeit: 'Dieselbe Pumpe (gleiches Laufrad, keine Laufraddurchmesser-Änderung), ähnliche Betriebspunkte (vergleichbarer Anströmwinkel, kein zu großer Drehzahlsprung)',
  annahmen: ['Wirkungsgrad bei n₂ näherungsweise gleich wie bei n₁', 'Keine Kavitation oder sonstige Abweichung vom Ähnlichkeitsverhalten'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau' },
  beispiel: {
    // n1=1450 1/min, n2=2900 1/min (Verdopplung), V1=10 m³/h, H1=20m, P1=5000W
    // Verhältnis=2 -> V2=20, H2=80, P2=40000
    bekannt: { n1: 1450 / 60, n2: 2900 / 60, V1: 10 / 3600, H1: 20, P1: 5000 },
    ziel: 'V2',
    erwartet: { V2: 20 / 3600, H2: 80, P2: 40000 },
    toleranzRelativ: 1e-6,
  },
}
