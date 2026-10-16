import type { Formula } from '../../types/formula'

/** Benetzte Querschnittsfläche eines liegenden Zylinders bei Füllhöhe h (0 ≤ h ≤ 2R). */
function benetzteFlaeche(R: number, h: number): number {
  const hKlamm = Math.max(0, Math.min(2 * R, h))
  const arg = Math.max(-1, Math.min(1, (R - hKlamm) / R))
  const wurzel = Math.sqrt(Math.max(0, 2 * R * hKlamm - hKlamm * hKlamm))
  return R * R * Math.acos(arg) - (R - hKlamm) * wurzel
}

/** Löst die Füllhöhe h aus dem Volumen per Bisektion (A(h) ist streng monoton in [0,2R]). */
function fuellhoeheAusVolumen(R: number, L: number, V: number): number {
  const vMax = Math.PI * R * R * L
  if (V <= 0) return 0
  if (V >= vMax) return 2 * R
  let lo = 0
  let hi = 2 * R
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const vMid = benetzteFlaeche(R, mid) * L
    if (vMid < V) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export const liegenderZylinderTeilfuellung: Formula = {
  id: 'liegender-zylinder-teilfuellung',
  name: 'Liegender Zylinder, Teilfüllung',
  kategorie: 'Behälter & Geometrie',
  stichworte: ['liegender zylinder', 'teilfüllung', 'füllstand', 'tank', 'behälter'],
  latex:
    'A = R^2 \\arccos\\!\\left(\\dfrac{R-h}{R}\\right) - (R-h)\\sqrt{2Rh - h^2} \\qquad V = A \\cdot L',
  variablen: [
    { id: 'R', symbol: 'R', name: 'Innenradius', dimension: 'length', defaultUnit: 'mm' },
    { id: 'L', symbol: 'L', name: 'Länge', dimension: 'length', defaultUnit: 'm' },
    { id: 'h', symbol: 'h', name: 'Füllhöhe', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 'V', symbol: 'V', name: 'Füllvolumen', dimension: 'volume', defaultUnit: 'l' },
  ],
  zielgroessen: ['V', 'h'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (bekannt.R <= 0) throw new Error('Radius muss größer 0 sein')
    if (ziel === 'V') {
      if (bekannt.h < 0 || bekannt.h > 2 * bekannt.R) {
        throw new Error('Füllhöhe muss zwischen 0 und 2R liegen')
      }
      return { V: benetzteFlaeche(bekannt.R, bekannt.h) * bekannt.L }
    }
    if (ziel === 'h') {
      if (bekannt.V < 0) throw new Error('Volumen darf nicht negativ sein')
      return { h: fuellhoeheAusVolumen(bekannt.R, bekannt.L, bekannt.V) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Liegender Kreiszylinder mit ebenen Böden (Zylinderenden nicht gewölbt berücksichtigt)',
  annahmen: ['Zylinder exakt horizontal', 'Böden tragen nicht zum Volumen bei (bei gewölbten Böden separat addieren)'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', kapitel: 'Kreisabschnittsfläche' },
  beispiel: {
    // R=0,5m, L=2m, h=0,3m -> A=0,19816836 m², V=0,39633671 m³
    bekannt: { R: 0.5, L: 2, h: 0.3 },
    ziel: 'V',
    erwartet: { V: 0.39633671 },
    toleranzRelativ: 1e-5,
  },
}
