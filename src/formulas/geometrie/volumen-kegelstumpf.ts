import type { Formula } from '../../types/formula'

export const volumenKegelstumpf: Formula = {
  id: 'volumen-kegelstumpf',
  name: 'Volumen Kegelstumpf',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['volumen', 'kegelstumpf', 'kegel', 'trichter', 'behälter'],
  latex: 'V = \\dfrac{\\pi \\, h}{3} \\left(R^2 + R r + r^2\\right)',
  variablen: [
    { id: 'R', symbol: 'R', name: 'Radius große Grundfläche', dimension: 'length', defaultUnit: 'mm' },
    { id: 'r', symbol: 'r', name: 'Radius kleine Grundfläche (0 für Kegel)', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 'h', symbol: 'h', name: 'Höhe', dimension: 'length', defaultUnit: 'mm' },
    { id: 'V', symbol: 'V', name: 'Volumen', dimension: 'volume', defaultUnit: 'l' },
  ],
  zielgroessen: ['V'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'V') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.R < 0 || bekannt.r < 0) throw new Error('Radien dürfen nicht negativ sein')
    const V = ((Math.PI * bekannt.h) / 3) * (bekannt.R ** 2 + bekannt.R * bekannt.r + bekannt.r ** 2)
    return { V }
  },
  gueltigkeit: 'Kreiskegelstumpf; für r=R ergibt sich der Zylinder, für r=0 der Kegel',
  annahmen: [],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', kapitel: 'Geometrische Grundformeln' },
  beispiel: {
    // R=0,5m, r=0,3m, h=1m -> V = π*1/3*(0,25+0,15+0,09) = π/3*0,49 = 0,5131268 m³
    bekannt: { R: 0.5, r: 0.3, h: 1 },
    ziel: 'V',
    erwartet: { V: 0.5131268 },
    toleranzRelativ: 1e-6,
  },
}
