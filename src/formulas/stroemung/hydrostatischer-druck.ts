import type { Formula } from '../../types/formula'
import { G } from '../../units'

export const hydrostatischerDruck: Formula = {
  id: 'hydrostatischer-druck',
  name: 'Hydrostatischer Druck',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['hydrostatik', 'druck', 'füllstand', 'behälter'],
  latex: 'p = \\rho \\, g \\, h',
  variablen: [
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    { id: 'h', symbol: 'h', name: 'Füllhöhe', dimension: 'length', defaultUnit: 'm' },
    { id: 'p', symbol: 'p', name: 'Hydrostatischer Druck', dimension: 'pressure', defaultUnit: 'bar' },
  ],
  zielgroessen: ['p', 'h', 'rho'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'p') return { p: bekannt.rho * G * bekannt.h }
    if (ziel === 'h') {
      if (bekannt.rho <= 0) throw new Error('Dichte muss größer 0 sein')
      return { h: bekannt.p / (bekannt.rho * G) }
    }
    if (ziel === 'rho') {
      if (bekannt.h <= 0) throw new Error('Füllhöhe muss größer 0 sein')
      return { rho: bekannt.p / (G * bekannt.h) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Ruhendes, inkompressibles Fluid im Schwerefeld der Erde',
  annahmen: ['Dichte über die Füllhöhe konstant', 'Keine Überlagerung durch äußeren Druck (relativer Druck)'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik', kapitel: 'Hydrostatischer Druck' },
  warnungen: (bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    const h = ziel === 'h' ? ergebnis.h : bekannt.h
    if (h !== undefined && h < 0) warnungen.push('Negative Füllhöhe ist physikalisch nicht sinnvoll.')
    return warnungen
  },
  beispiel: {
    // ρ = 1000 kg/m³, h = 10 m -> p = 1000 * 9,80665 * 10 = 98066,5 Pa
    bekannt: { rho: 1000, h: 10 },
    ziel: 'p',
    erwartet: { p: 98066.5 },
    toleranzRelativ: 1e-9,
  },
}
