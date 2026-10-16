import type { Formula } from '../../types/formula'

export const volumenZylinder: Formula = {
  id: 'volumen-zylinder',
  name: 'Volumen Zylinder',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['volumen', 'zylinder', 'behälter', 'geometrie'],
  latex: 'V = \\pi \\, r^2 \\, h',
  variablen: [
    { id: 'r', symbol: 'r', name: 'Radius', dimension: 'length', defaultUnit: 'mm' },
    { id: 'h', symbol: 'h', name: 'Höhe', dimension: 'length', defaultUnit: 'm' },
    { id: 'V', symbol: 'V', name: 'Volumen', dimension: 'volume', defaultUnit: 'l' },
  ],
  zielgroessen: ['V', 'r', 'h'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'V') return { V: Math.PI * bekannt.r ** 2 * bekannt.h }
    if (ziel === 'h') {
      if (bekannt.r === 0) throw new Error('Radius darf nicht 0 sein')
      return { h: bekannt.V / (Math.PI * bekannt.r ** 2) }
    }
    if (ziel === 'r') {
      if (bekannt.h <= 0) throw new Error('Höhe muss größer 0 sein')
      return { r: Math.sqrt(bekannt.V / (Math.PI * bekannt.h)) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Kreiszylinder, voller Querschnitt',
  annahmen: [],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', kapitel: 'Geometrische Grundformeln' },
  beispiel: {
    // r=0,5m, h=2m -> V=π*0,25*2=1,5707963 m³
    bekannt: { r: 0.5, h: 2 },
    ziel: 'V',
    erwartet: { V: 1.5707963 },
    toleranzRelativ: 1e-6,
  },
}
