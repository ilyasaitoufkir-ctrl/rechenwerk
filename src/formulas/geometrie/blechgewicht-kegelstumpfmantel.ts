import type { Formula } from '../../types/formula'

export const blechgewichtKegelstumpfmantel: Formula = {
  id: 'blechgewicht-kegelstumpfmantel',
  name: 'Blechgewicht Kegelstumpfmantel (Trichter)',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['blechgewicht', 'trichter', 'kegelstumpf', 'mantelfläche', 'gewicht'],
  latex: 'M = \\pi (R + r) \\sqrt{(R-r)^2 + h^2} \\qquad m = \\rho \\cdot M \\cdot s',
  variablen: [
    { id: 'R', symbol: 'R', name: 'Radius große Grundfläche', dimension: 'length', defaultUnit: 'mm' },
    { id: 'r', symbol: 'r', name: 'Radius kleine Grundfläche', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 'h', symbol: 'h', name: 'Höhe', dimension: 'length', defaultUnit: 'mm' },
    { id: 's', symbol: 's', name: 'Blechdicke', dimension: 'length', defaultUnit: 'mm' },
    {
      id: 'rho',
      symbol: '\\rho',
      name: 'Dichte Werkstoff',
      dimension: 'density',
      defaultUnit: 'kgm3',
      hinweis: 'Zum Vergleich: Edelstahl 1.4301 ≈ 7900 kg/m³, PP ≈ 905 kg/m³, PE ≈ 950 kg/m³',
    },
    { id: 'm', symbol: 'm', name: 'Gewicht', dimension: 'mass', defaultUnit: 'kg' },
  ],
  zielgroessen: ['m'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'm') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const M = Math.PI * (bekannt.R + bekannt.r) * Math.sqrt((bekannt.R - bekannt.r) ** 2 + bekannt.h ** 2)
    return { m: bekannt.rho * M * bekannt.s }
  },
  gueltigkeit: 'Kegelstumpfmantel (z. B. Trichter) konstanter Wanddicke, abgewickelt',
  annahmen: ['Keine Abzüge für Stutzen/Schweißnahtüberhöhung'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau' },
  beispiel: {
    // R=0,5m, r=0,1m, h=0,6m, s=3mm=0,003m, ρ=7900 (Edelstahl)
    // M = π*0,6*sqrt(0,16+0,36) = π*0,6*sqrt(0,52) = 1,3592608 m²
    // m = 7900*1,3592608*0,003 = 32,2145 kg
    bekannt: { R: 0.5, r: 0.1, h: 0.6, s: 0.003, rho: 7900 },
    ziel: 'm',
    erwartet: { m: 32.2145 },
    toleranzRelativ: 1e-4,
  },
}
