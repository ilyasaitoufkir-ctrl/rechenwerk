import type { Formula } from '../../types/formula'

export const waermeleitungEbeneWand: Formula = {
  id: 'waermeleitung-ebene-wand',
  name: 'Wärmeleitung, ebene Wand',
  kategorie: 'Wärmeübertragung',
  stichworte: ['wärmeleitung', 'wand', 'mehrschichtig', 'wärmestrom', 'lambda'],
  latex: '\\dot{Q} = \\dfrac{A \\cdot \\Delta T}{\\sum \\frac{s_i}{\\lambda_i}}',
  variablen: [
    { id: 'A', symbol: 'A', name: 'Fläche', dimension: 'area', defaultUnit: 'm2' },
    { id: 'dT', symbol: '\\Delta T', name: 'Temperaturdifferenz', dimension: 'temperatureDelta', defaultUnit: 'K' },
    {
      id: 'R',
      symbol: '\\sum \\frac{s_i}{\\lambda_i}',
      name: 'Wandschichten',
      dimension: 'thermalResistanceArea',
      defaultUnit: 'm2KW',
    },
    { id: 'Q_dot', symbol: '\\dot{Q}', name: 'Wärmestrom', dimension: 'power', defaultUnit: 'W' },
  ],
  zielgroessen: ['Q_dot', 'A', 'dT'],
  schichtfeld: { zielVariable: 'R', dickeName: 'Dicke s', leitfaehigkeitName: 'Wärmeleitfähigkeit λ' },
  compute: (bekannt, ziel): Record<string, number> => {
    if (bekannt.R <= 0) throw new Error('Wandwiderstand muss größer 0 sein - mindestens eine Schicht eingeben')
    if (ziel === 'Q_dot') return { Q_dot: (bekannt.A * bekannt.dT) / bekannt.R }
    if (ziel === 'A') return { A: (bekannt.Q_dot * bekannt.R) / bekannt.dT }
    if (ziel === 'dT') return { dT: (bekannt.Q_dot * bekannt.R) / bekannt.A }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Ebene, stationäre Wärmeleitung ohne innere Wärmequellen, eindimensional',
  annahmen: [
    'Stationärer Zustand (zeitlich konstante Temperaturen)',
    'Wärmeleitfähigkeit je Schicht konstant (temperaturunabhängig)',
    'Kein Kontaktwiderstand zwischen den Schichten',
  ],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Wärmeleitung in ebenen Wänden' },
  beispiel: {
    // A=10 m², ΔT=20K, eine Schicht 240mm Ziegel λ=0,6 W/(mK) -> R=0,24/0,6=0,4 m²K/W
    // Q̇ = 10*20/0,4 = 500 W
    bekannt: { A: 10, dT: 20, R: 0.4 },
    ziel: 'Q_dot',
    erwartet: { Q_dot: 500 },
    toleranzRelativ: 1e-9,
  },
}
