import type { Formula } from '../../types/formula'

export const dampfkosten: Formula = {
  id: 'dampfkosten',
  name: 'Dampfkosten',
  kategorie: 'Dampf (IAPWS-IF97)',
  stichworte: ['dampfkosten', 'kosten', 'preis', 'tonne'],
  latex: 'K = \\dot{m}_D \\cdot p_D',
  variablen: [
    { id: 'm_dot_D', symbol: '\\dot{m}_D', name: 'Dampfmenge', dimension: 'massFlow', defaultUnit: 'kgh' },
    { id: 'preisProTonne', symbol: 'p_D', name: 'Dampfpreis je Tonne', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'betriebsstunden', symbol: 't_B', name: 'Betriebsstunden pro Jahr', dimension: 'time', defaultUnit: 'h' },
    { id: 'kostenProStunde', symbol: 'K_h', name: 'Kosten pro Stunde', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'kostenProJahr', symbol: 'K_a', name: 'Kosten pro Jahr', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['kostenProStunde'],
  zusatzAusgaben: ['kostenProJahr'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'kostenProStunde') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const tonnenProStunde = (bekannt.m_dot_D * 3600) / 1000
    const kostenProStunde = tonnenProStunde * bekannt.preisProTonne
    const betriebsstundenH = bekannt.betriebsstunden / 3600
    const kostenProJahr = kostenProStunde * betriebsstundenH
    return { kostenProStunde, kostenProJahr }
  },
  gueltigkeit: 'Konstanter Dampfpreis und konstante Dampfmenge über die Betriebsstunden',
  annahmen: ['Dampfpreis enthält bereits Erzeugungs- und Verteilkosten'],
  quelle: { werk: 'Eigene Herleitung aus Dampfmenge × Preis', unsicher: true },
  beispiel: {
    // ṁ_D=500 kg/h=0,13889 kg/s, Preis=25 €/t, tB=6000h=21600000s
    // Kosten/h = 0,5 t/h * 25 €/t = 12,5 €/h
    // Kosten/Jahr = 12,5 * 6000 = 75000 €
    bekannt: { m_dot_D: 0.138889, preisProTonne: 25, betriebsstunden: 21600000 },
    ziel: 'kostenProStunde',
    erwartet: { kostenProStunde: 12.5, kostenProJahr: 75000 },
    toleranzRelativ: 1e-3,
  },
}
