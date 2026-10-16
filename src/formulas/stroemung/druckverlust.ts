import type { Formula } from '../../types/formula'
import { G } from '../../units'

export const druckverlust: Formula = {
  id: 'druckverlust-darcy-weisbach',
  name: 'Druckverlust nach Darcy-Weisbach',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['druckverlust', 'darcy', 'weisbach', 'reibungsverlust', 'druckhöhe'],
  latex: '\\Delta p = \\left(\\lambda \\dfrac{L}{d} + \\sum \\zeta\\right) \\dfrac{\\rho \\, v^2}{2}',
  variablen: [
    { id: 'lambda', symbol: '\\lambda', name: 'Rohrreibungszahl', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'L', symbol: 'L', name: 'Rohrlänge', dimension: 'length', defaultUnit: 'm' },
    { id: 'd', symbol: 'd', name: 'Innendurchmesser', dimension: 'length', defaultUnit: 'mm' },
    {
      id: 'zeta',
      symbol: '\\sum \\zeta',
      name: 'Summe Widerstandsbeiwerte Einbauten',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 0,
    },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    { id: 'v', symbol: 'v', name: 'Strömungsgeschwindigkeit', dimension: 'velocity', defaultUnit: 'ms' },
    { id: 'dp', symbol: '\\Delta p', name: 'Druckverlust', dimension: 'pressure', defaultUnit: 'mbar' },
    { id: 'h', symbol: 'h', name: 'Druckverlust als Druckhöhe', dimension: 'length', defaultUnit: 'm' },
  ],
  zielgroessen: ['dp'],
  zusatzAusgaben: ['h'],
  compute: (bekannt, ziel) => {
    if (ziel !== 'dp') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.d <= 0) throw new Error('Durchmesser muss größer 0 sein')
    const dp = (bekannt.lambda * (bekannt.L / bekannt.d) + bekannt.zeta) * bekannt.rho * bekannt.v ** 2 / 2
    const h = dp / (bekannt.rho * G)
    return { dp, h }
  },
  gueltigkeit: 'Stationäre, inkompressible Rohrströmung, voll ausgebildetes Geschwindigkeitsprofil',
  annahmen: ['Rohrlänge L bereits inkl. gestreckter Länge von Bögen (sofern nicht über ζ erfasst)'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik', kapitel: 'Darcy-Weisbach-Gleichung' },
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.v > 10) {
      warnungen.push(`Geschwindigkeit ${bekannt.v.toFixed(2)} m/s ist ungewöhnlich hoch für Flüssigkeiten.`)
    }
    if (bekannt.zeta < 0) warnungen.push('Σζ kann nicht negativ sein.')
    return warnungen
  },
  beispiel: {
    // λ=0,02, L=100 m, d=0,1 m, Σζ=2, ρ=1000 kg/m³, v=2 m/s
    // Δp = (0,02*(100/0,1)+2)*1000*2²/2 = (20+2)*2000 = 44000 Pa
    // h = 44000/(1000*9,80665) = 4,48675 m
    bekannt: { lambda: 0.02, L: 100, d: 0.1, zeta: 2, rho: 1000, v: 2 },
    ziel: 'dp',
    erwartet: { dp: 44000, h: 4.486751337 },
    toleranzRelativ: 1e-6,
  },
}
