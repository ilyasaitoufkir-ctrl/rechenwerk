import type { Formula } from '../../types/formula'

export const volumenQuader: Formula = {
  id: 'volumen-quader',
  name: 'Volumen Quader',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['volumen', 'quader', 'behälter', 'geometrie'],
  latex: 'V = a \\cdot b \\cdot c',
  variablen: [
    { id: 'a', symbol: 'a', name: 'Länge', dimension: 'length', defaultUnit: 'm' },
    { id: 'b', symbol: 'b', name: 'Breite', dimension: 'length', defaultUnit: 'm' },
    { id: 'c', symbol: 'c', name: 'Höhe', dimension: 'length', defaultUnit: 'm' },
    { id: 'V', symbol: 'V', name: 'Volumen', dimension: 'volume', defaultUnit: 'm3' },
  ],
  zielgroessen: ['V', 'a', 'b', 'c'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'V') return { V: bekannt.a * bekannt.b * bekannt.c }
    if (ziel === 'a') {
      if (bekannt.b * bekannt.c === 0) throw new Error('b · c darf nicht 0 sein')
      return { a: bekannt.V / (bekannt.b * bekannt.c) }
    }
    if (ziel === 'b') {
      if (bekannt.a * bekannt.c === 0) throw new Error('a · c darf nicht 0 sein')
      return { b: bekannt.V / (bekannt.a * bekannt.c) }
    }
    if (ziel === 'c') {
      if (bekannt.a * bekannt.b === 0) throw new Error('a · b darf nicht 0 sein')
      return { c: bekannt.V / (bekannt.a * bekannt.b) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Quader (Rechteckbehälter)',
  annahmen: [],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', kapitel: 'Geometrische Grundformeln' },
  beispiel: {
    // a=1,2m, b=0,8m, c=0,5m -> V=0,48 m³
    bekannt: { a: 1.2, b: 0.8, c: 0.5 },
    ziel: 'V',
    erwartet: { V: 0.48 },
    toleranzRelativ: 1e-9,
  },
}
