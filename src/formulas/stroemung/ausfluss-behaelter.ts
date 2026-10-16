import type { Formula } from '../../types/formula'
import { G } from '../../units'

export const ausflussBehaelter: Formula = {
  id: 'ausfluss-behaelter',
  name: 'Ausfluss aus Behälter',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['ausfluss', 'behälter', 'torricelli', 'ausflusszahl', 'öffnung'],
  latex: 'v = \\mu \\sqrt{2 g h} \\qquad \\dot{V} = \\mu \\, A \\sqrt{2 g h}',
  variablen: [
    {
      id: 'mu',
      symbol: '\\mu',
      name: 'Ausflusszahl',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 0,
      max: 1,
      hinweis:
        'Richtwerte: scharfkantige Öffnung μ ≈ 0,60-0,65; gut gerundete Öffnung μ ≈ 0,97-0,99',
    },
    { id: 'h', symbol: 'h', name: 'Füllhöhe über Öffnung', dimension: 'length', defaultUnit: 'm' },
    { id: 'A', symbol: 'A', name: 'Öffnungsquerschnitt', dimension: 'area', defaultUnit: 'cm2' },
    { id: 'v', symbol: 'v', name: 'Ausflussgeschwindigkeit', dimension: 'velocity', defaultUnit: 'ms' },
    {
      id: 'V_dot',
      symbol: '\\dot{V}',
      name: 'Volumenstrom',
      dimension: 'volumeFlow',
      defaultUnit: 'm3h',
    },
  ],
  zielgroessen: ['V_dot'],
  zusatzAusgaben: ['v'],
  compute: (bekannt, ziel) => {
    if (ziel !== 'V_dot') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.h < 0) throw new Error('Füllhöhe darf nicht negativ sein')
    const v = bekannt.mu * Math.sqrt(2 * G * bekannt.h)
    return { v, V_dot: v * bekannt.A }
  },
  gueltigkeit: 'Ausfluss aus großer Öffnung im Behälterboden/-wand, quasi-stationär (h ändert sich langsam)',
  annahmen: ['Behälterquerschnitt groß gegenüber Öffnung', 'Umgebungsdruck auf beiden Seiten gleich'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik', kapitel: 'Ausfluss aus Gefäßen (Torricelli)' },
  richtwert: true,
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.mu > 1) warnungen.push('Ausflusszahl μ > 1 ist physikalisch nicht plausibel.')
    if (bekannt.mu <= 0) warnungen.push('Ausflusszahl μ muss größer 0 sein.')
    return warnungen
  },
  beispiel: {
    // μ = 0,62 (scharfkantig), h = 1 m, A = 0,001 m²
    // v = 0,62 * sqrt(2*9,80665*1) = 2,745788 m/s
    // V̇ = v * A = 0,002745788 m³/s
    bekannt: { mu: 0.62, h: 1, A: 0.001 },
    ziel: 'V_dot',
    erwartet: { v: 2.745788142, V_dot: 0.002745788142 },
    toleranzRelativ: 1e-6,
  },
}
