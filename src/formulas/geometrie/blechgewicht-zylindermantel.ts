import type { Formula } from '../../types/formula'

export const blechgewichtZylindermantel: Formula = {
  id: 'blechgewicht-zylindermantel',
  name: 'Blechgewicht Zylindermantel',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['blechgewicht', 'zylindermantel', 'mantelfläche', 'gewicht'],
  latex: 'm = \\rho \\cdot \\pi \\, d \\, h \\cdot s',
  variablen: [
    { id: 'd', symbol: 'd', name: 'Durchmesser', dimension: 'length', defaultUnit: 'mm' },
    { id: 'h', symbol: 'h', name: 'Höhe', dimension: 'length', defaultUnit: 'm' },
    { id: 's', symbol: 's', name: 'Blechdicke', dimension: 'length', defaultUnit: 'mm' },
    {
      id: 'rho',
      symbol: '\\rho',
      name: 'Dichte Werkstoff',
      dimension: 'density',
      defaultUnit: 'kgm3',
      hinweis: 'Richtwerte: Edelstahl 1.4301 ≈ 7900, PP ≈ 905, PE ≈ 950 kg/m³',
    },
    { id: 'm', symbol: 'm', name: 'Gewicht', dimension: 'mass', defaultUnit: 'kg' },
  ],
  zielgroessen: ['m'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'm') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { m: bekannt.rho * Math.PI * bekannt.d * bekannt.h * bekannt.s }
  },
  gueltigkeit: 'Zylindrischer Mantel konstanter Wanddicke, abgewickelt als Rechteck',
  annahmen: ['Keine Abzüge für Stutzen/Schweißnahtüberhöhung'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau' },
  beispiel: {
    // d=1m, h=1,5m, s=3mm=0,003m, ρ=7900 -> m=7900*π*1*1,5*0,003=111,6836 kg
    bekannt: { d: 1, h: 1.5, s: 0.003, rho: 7900 },
    ziel: 'm',
    erwartet: { m: 111.6836 },
    toleranzRelativ: 1e-5,
  },
}
