import type { Formula } from '../../types/formula'

export const kondensatorWaermelast: Formula = {
  id: 'kondensator-waermelast',
  name: 'Wärmelast Kondensator und Verdampfer',
  kategorie: 'Rektifikation',
  stichworte: ['kondensator', 'verdampfer', 'wärmelast', 'heizdampfbedarf', 'rücklaufverhältnis'],
  latex: '\\dot{Q}_K = D \\, (R+1) \\, r \\qquad \\dot{Q}_B \\approx \\dot{Q}_K',
  variablen: [
    { id: 'D', symbol: 'D', name: 'Destillatmenge', dimension: 'massFlow', defaultUnit: 'kgh' },
    { id: 'R', symbol: 'R', name: 'Rücklaufverhältnis', dimension: 'dimensionless', defaultUnit: '_', min: 0 },
    { id: 'r', symbol: 'r', name: 'Verdampfungsenthalpie', dimension: 'specificEnthalpy', defaultUnit: 'kJkg', hinweis: 'Für Wasser: aus "Sattdampftafel" per Ergebnis übernehmen' },
    { id: 'QK', symbol: '\\dot{Q}_K', name: 'Kondensatorwärmelast', dimension: 'power', defaultUnit: 'kW' },
    { id: 'QB', symbol: '\\dot{Q}_B', name: 'Verdampferleistung (Näherung)', dimension: 'power', defaultUnit: 'kW' },
  ],
  zielgroessen: ['QK'],
  zusatzAusgaben: ['QB'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'QK') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const QK = bekannt.D * (bekannt.R + 1) * bekannt.r
    return { QK, QB: QK }
  },
  gueltigkeit: 'Kolonne mit konstantem molaren Rücklauf (CMO), Totalkondensator',
  annahmen: [
    'Siedender Zulauf (q=1) und ähnliche molare Verdampfungsenthalpien beider Komponenten angenommen - unter dieser Annahme ist die Verdampferleistung näherungsweise gleich der Kondensatorwärmelast (Q̇B ≈ Q̇K)',
    'Für den Heizdampfbedarf Q̇B als Wärmestrom in die bestehende Formel "Dampfbedarf zum Aufheizen" (Kategorie Dampf) per Ergebnis übernehmen eingeben',
  ],
  quelle: { werk: 'McCabe-Thiele-Verfahren, Standardwerke der thermischen Verfahrenstechnik' },
  beispiel: {
    // D=100 kg/h=0,027778 kg/s, R=2, r=2257 kJ/kg=2257000 J/kg (Wasser bei 1,01325 bar)
    // QK = 0,027778*3*2257000 = 188083,33 W
    bekannt: { D: 100 / 3600, R: 2, r: 2257000 },
    ziel: 'QK',
    erwartet: { QK: 188083.33 },
    toleranzRelativ: 1e-4,
  },
}
