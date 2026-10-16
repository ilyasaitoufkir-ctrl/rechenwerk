import type { Formula } from '../../types/formula'

export const erdgasAbrechnung: Formula = {
  id: 'erdgas-abrechnung',
  name: 'Erdgasabrechnung',
  kategorie: 'Energie & Kosten',
  stichworte: ['erdgas', 'abrechnung', 'zustandszahl', 'brennwert', 'gaszähler'],
  latex: 'E = V_{Betrieb} \\cdot z \\cdot H_s',
  variablen: [
    { id: 'V', symbol: 'V_{Betrieb}', name: 'Gasmenge (Betriebszustand, Zähler)', dimension: 'volume', defaultUnit: 'm3' },
    { id: 'z', symbol: 'z', name: 'Zustandszahl', dimension: 'dimensionless', defaultUnit: '_', hinweis: 'Von der Gasrechnung übernehmen, Richtwert meist zwischen 0,94 und 0,97' },
    { id: 'Hs', symbol: 'H_s', name: 'Brennwert', dimension: 'calorificValue', defaultUnit: 'kWhm3', hinweis: 'Von der Gasrechnung übernehmen, typisch ca. 10-11,5 kWh/m³' },
    { id: 'E', symbol: 'E', name: 'Energiemenge (Brennwertbezug)', dimension: 'energy', defaultUnit: 'kWh' },
  ],
  zielgroessen: ['E'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'E') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { E: bekannt.V * bekannt.z * bekannt.Hs }
  },
  gueltigkeit: 'Abrechnungsformel nach den in Deutschland üblichen Gasliefer- und Messbedingungen',
  annahmen: ['z und H_s stammen von der Gasrechnung bzw. vom Netzbetreiber, nicht selbst gemessen'],
  quelle: { werk: 'DVGW Arbeitsblatt G 685' },
  beispiel: {
    // V=1000 m³, z=0,9533, Hs=11,3 kWh/m³=40680000 J/m³
    // E = 1000*0,9533*40680000 = 38780244000 J = 10772,29 kWh
    bekannt: { V: 1000, z: 0.9533, Hs: 40680000 },
    ziel: 'E',
    erwartet: { E: 38780244000 },
    toleranzRelativ: 1e-6,
  },
}
