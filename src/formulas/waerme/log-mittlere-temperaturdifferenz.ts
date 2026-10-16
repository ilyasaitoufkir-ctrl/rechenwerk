import type { Formula } from '../../types/formula'

export const logMittlereTemperaturdifferenz: Formula = {
  id: 'log-mittlere-temperaturdifferenz',
  name: 'Mittlere logarithmische Temperaturdifferenz',
  kategorie: 'Wärmeübertragung',
  stichworte: ['lmtd', 'temperaturdifferenz', 'wärmetauscher', 'gleichstrom', 'gegenstrom'],
  latex: '\\Delta T_m = \\dfrac{\\Delta T_{gr} - \\Delta T_{kl}}{\\ln\\!\\left(\\Delta T_{gr} / \\Delta T_{kl}\\right)}',
  variablen: [
    { id: 'dTgr', symbol: '\\Delta T_{gr}', name: 'Größere Temperaturdifferenz', dimension: 'temperatureDelta', defaultUnit: 'K', min: 0 },
    { id: 'dTkl', symbol: '\\Delta T_{kl}', name: 'Kleinere Temperaturdifferenz', dimension: 'temperatureDelta', defaultUnit: 'K', min: 0 },
    { id: 'dTm', symbol: '\\Delta T_m', name: 'Mittlere log. Temperaturdifferenz', dimension: 'temperatureDelta', defaultUnit: 'K' },
  ],
  zielgroessen: ['dTm'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'dTm') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const { dTgr, dTkl } = bekannt
    if (dTgr <= 0 || dTkl <= 0) {
      throw new Error('Beide Temperaturdifferenzen müssen größer 0 sein (gleichsinniger Wärmeübergang vorausgesetzt)')
    }
    // Sonderfall ΔTgr = ΔTkl: Grenzwert des Ausdrucks ist ΔT selbst (0/0 vermeiden)
    if (Math.abs(dTgr - dTkl) < 1e-9 * Math.max(dTgr, dTkl)) {
      return { dTm: dTgr }
    }
    return { dTm: (dTgr - dTkl) / Math.log(dTgr / dTkl) }
  },
  gueltigkeit: 'Gleich- oder Gegenstrom-Wärmetauscher mit über die Fläche linear verlaufenden Temperaturprofilen',
  annahmen: ['Konstante Wärmekapazitätsströme beider Fluide', 'Kein Phasenwechsel innerhalb der Strecke (sonst konstante Temperatur)'],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Mittlere Temperaturdifferenz' },
  beispiel: {
    // ΔTgr=80K, ΔTkl=20K -> ΔTm=(80-20)/ln(80/20)=60/ln4=43,2808512 K
    bekannt: { dTgr: 80, dTkl: 20 },
    ziel: 'dTm',
    erwartet: { dTm: 43.2808512 },
    toleranzRelativ: 1e-6,
  },
}
