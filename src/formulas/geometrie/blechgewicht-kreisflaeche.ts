import type { Formula } from '../../types/formula'

export const blechgewichtKreisflaeche: Formula = {
  id: 'blechgewicht-kreisflaeche',
  name: 'Blechgewicht Kreisfläche (Boden/Deckel)',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['blechgewicht', 'kreisfläche', 'boden', 'deckel', 'gewicht'],
  latex: 'm = \\rho \\cdot \\dfrac{\\pi \\, d^2}{4} \\cdot s',
  variablen: [
    { id: 'd', symbol: 'd', name: 'Durchmesser', dimension: 'length', defaultUnit: 'mm' },
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
    return { m: bekannt.rho * ((Math.PI * bekannt.d ** 2) / 4) * bekannt.s }
  },
  gueltigkeit: 'Ebene Kreisplatte konstanter Dicke',
  annahmen: ['Keine Abzüge für Durchbrüche/Stutzen'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau' },
  beispiel: {
    // d=1m, s=3mm=0,003m, ρ=7900 kg/m³ -> m=7900*(π*1/4)*0,003=18,6139 kg
    bekannt: { d: 1, s: 0.003, rho: 7900 },
    ziel: 'm',
    erwartet: { m: 18.6139 },
    toleranzRelativ: 1e-5,
  },
}
