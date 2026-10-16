import type { Formula } from '../../types/formula'

export const grundlastenergie: Formula = {
  id: 'grundlastenergie',
  name: 'Grundlastenergie aus Leistung',
  kategorie: 'Energie & Kosten',
  stichworte: ['grundlast', 'energie', 'leistung', 'lastgang'],
  latex: 'E_{GL} = P_{GL} \\cdot t',
  variablen: [
    { id: 'pGrundlast', symbol: 'P_{GL}', name: 'Grundlastleistung', dimension: 'power', defaultUnit: 'kW' },
    { id: 'zeitraum', symbol: 't', name: 'Zeitraum', dimension: 'time', defaultUnit: 'h' },
    { id: 'eGrundlast', symbol: 'E_{GL}', name: 'Grundlastenergie', dimension: 'energy', defaultUnit: 'kWh' },
  ],
  zielgroessen: ['eGrundlast', 'pGrundlast', 'zeitraum'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'eGrundlast') return { eGrundlast: bekannt.pGrundlast * bekannt.zeitraum }
    if (ziel === 'pGrundlast') {
      if (bekannt.zeitraum === 0) throw new Error('Zeitraum darf nicht 0 sein')
      return { pGrundlast: bekannt.eGrundlast / bekannt.zeitraum }
    }
    if (ziel === 'zeitraum') {
      if (bekannt.pGrundlast === 0) throw new Error('Grundlastleistung darf nicht 0 sein')
      return { zeitraum: bekannt.eGrundlast / bekannt.pGrundlast }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Grundlast als über den Zeitraum konstant angenommene Leistung',
  annahmen: ['Leistung während des gesamten Zeitraums konstant (sonst Grundlastenergie alternativ aus zwei Zählerständen bilden und direkt in "Grundlastquote" eingeben)'],
  quelle: { werk: 'Eigene Herleitung', unsicher: true },
  beispiel: {
    // 100 kW über 400 h -> 40000 kWh = 1,44e11 J
    bekannt: { pGrundlast: 100000, zeitraum: 1440000 },
    ziel: 'eGrundlast',
    erwartet: { eGrundlast: 1.44e11 },
    toleranzRelativ: 1e-9,
  },
}
