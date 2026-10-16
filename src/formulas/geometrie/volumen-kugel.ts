import type { Formula } from '../../types/formula'

export const volumenKugel: Formula = {
  id: 'volumen-kugel',
  name: 'Volumen Kugel',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['volumen', 'kugel', 'geometrie'],
  latex: 'V = \\dfrac{4}{3} \\pi \\, r^3',
  variablen: [
    { id: 'r', symbol: 'r', name: 'Radius', dimension: 'length', defaultUnit: 'mm' },
    { id: 'V', symbol: 'V', name: 'Volumen', dimension: 'volume', defaultUnit: 'l' },
  ],
  zielgroessen: ['V', 'r'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'V') return { V: (4 / 3) * Math.PI * bekannt.r ** 3 }
    if (ziel === 'r') {
      if (bekannt.V < 0) throw new Error('Volumen darf nicht negativ sein')
      return { r: Math.cbrt((3 * bekannt.V) / (4 * Math.PI)) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Vollkugel',
  annahmen: [],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', kapitel: 'Geometrische Grundformeln' },
  beispiel: {
    // r=0,3m -> V = 4/3*π*0,027 = 0,1130973 m³
    bekannt: { r: 0.3 },
    ziel: 'V',
    erwartet: { V: 0.1130973 },
    toleranzRelativ: 1e-6,
  },
}
