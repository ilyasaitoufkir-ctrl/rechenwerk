import type { Formula } from '../../types/formula'
import { regime, rohrreibungszahl as berechneLambda } from '../../lib/colebrook'

export const rohrreibungszahl: Formula = {
  id: 'rohrreibungszahl',
  name: 'Rohrreibungszahl λ',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['lambda', 'rohrreibungszahl', 'colebrook', 'moody', 'reibung'],
  latex:
    '\\lambda = \\dfrac{64}{Re}\\ \\text{(laminar)}\\qquad \\dfrac{1}{\\sqrt{\\lambda}} = -2\\log_{10}\\left(\\dfrac{k}{3{,}71\\,d}+\\dfrac{2{,}51}{Re\\sqrt{\\lambda}}\\right)\\ \\text{(turbulent)}',
  variablen: [
    { id: 'Re', symbol: 'Re', name: 'Reynoldszahl', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'k', symbol: 'k', name: 'Absolute Rauheit', dimension: 'length', defaultUnit: 'mm' },
    { id: 'd', symbol: 'd', name: 'Innendurchmesser', dimension: 'length', defaultUnit: 'mm' },
    { id: 'lambda', symbol: '\\lambda', name: 'Rohrreibungszahl', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['lambda'],
  compute: (bekannt, ziel) => {
    if (ziel !== 'lambda') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { lambda: berechneLambda(bekannt.Re, bekannt.k, bekannt.d) }
  },
  gueltigkeit: 'Kreisrundes, hydraulisch raues oder glattes Rohr, ausgebildete Strömung',
  annahmen: ['Gleichmäßig verteilte Rauheit', 'Newtonsches Fluid'],
  quelle: {
    werk: 'Sigloch, Technische Fluidmechanik; Bohl/Elmendorf, Technische Strömungslehre',
    kapitel: 'Colebrook-White-Gleichung',
  },
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (regime(bekannt.Re) === 'uebergang') {
      warnungen.push(
        'Übergangsbereich (2300 ≤ Re < 4000): λ ist hier nicht zuverlässig bestimmbar, Ergebnis als Richtwert betrachten.',
      )
    }
    if (bekannt.k >= bekannt.d) {
      warnungen.push('Rauheit k ist nicht kleiner als der Durchmesser - Eingabe prüfen.')
    }
    return warnungen
  },
  beispiel: {
    // Hydraulisch glatt (k -> 0), Re = 1e5: Vergleich mit Colebrook-White-Iteration
    bekannt: { Re: 1e5, k: 1e-9, d: 0.1 },
    ziel: 'lambda',
    erwartet: { lambda: 0.0179898 },
    toleranzRelativ: 1e-3,
  },
}
