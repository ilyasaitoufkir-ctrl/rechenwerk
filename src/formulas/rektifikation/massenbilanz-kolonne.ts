import type { Formula } from '../../types/formula'

export const massenbilanzKolonne: Formula = {
  id: 'massenbilanz-kolonne',
  name: 'Gesamt- und Komponentenbilanz Kolonne',
  kategorie: 'Rektifikation',
  stichworte: ['massenbilanz', 'destillat', 'sumpf', 'kolonne', 'stoffbilanz'],
  latex: 'F = D + B \\qquad F \\, x_F = D \\, x_D + B \\, x_B',
  variablen: [
    { id: 'F', symbol: 'F', name: 'Zulaufmenge', dimension: 'massFlow', defaultUnit: 'kgh' },
    { id: 'xF', symbol: 'x_F', name: 'Zulaufzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'xD', symbol: 'x_D', name: 'Destillatzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'xB', symbol: 'x_B', name: 'Sumpfzusammensetzung', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'D', symbol: 'D', name: 'Destillatmenge', dimension: 'massFlow', defaultUnit: 'kgh' },
    { id: 'B', symbol: 'B', name: 'Sumpfmenge', dimension: 'massFlow', defaultUnit: 'kgh' },
  ],
  zielgroessen: ['D'],
  zusatzAusgaben: ['B'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'D') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const { F, xF, xD, xB } = bekannt
    if (Math.abs(xD - xB) < 1e-12) throw new Error('x_D und x_B dürfen nicht gleich sein')
    if (!(xB < xF && xF < xD) && !(xD < xF && xF < xB)) {
      throw new Error('x_F muss zwischen x_B und x_D liegen')
    }
    const D = (F * (xF - xB)) / (xD - xB)
    const B = F - D
    return { D, B }
  },
  gueltigkeit: 'Stationäre Kolonne, binäres Gemisch, reine Mengen-/Stoffbilanz ohne Reaktion',
  annahmen: ['Stationärer Betrieb', 'Keine Verluste, kein Nebenabzug'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik; Standardwerke der thermischen Verfahrenstechnik' },
  warnungen: (_bekannt, _ziel, ergebnis) => {
    const warnungen: string[] = []
    if (ergebnis.D < 0 || ergebnis.B < 0) warnungen.push('Negative Destillat- oder Sumpfmenge - Eingaben prüfen.')
    return warnungen
  },
  beispiel: {
    // F=100 kg/h=0,02778 kg/s, xF=0,4, xD=0,95, xB=0,02
    // D = 100*(0,4-0,02)/(0,95-0,02) = 100*0,38/0,93 = 40,86022 kg/h
    bekannt: { F: 100 / 3600, xF: 0.4, xD: 0.95, xB: 0.02 },
    ziel: 'D',
    erwartet: { D: 40.860215 / 3600, B: 59.139785 / 3600 },
    toleranzRelativ: 1e-5,
  },
}
