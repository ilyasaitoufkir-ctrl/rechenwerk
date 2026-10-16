import type { Formula } from '../../types/formula'

export const stromkosten: Formula = {
  id: 'stromkosten',
  name: 'Stromkosten',
  kategorie: 'Energie & Kosten',
  stichworte: ['strom', 'stromkosten', 'arbeitspreis', 'leistungspreis'],
  latex: 'K = p_{A} \\cdot E + p_{L} \\cdot P',
  variablen: [
    { id: 'arbeitspreis', symbol: 'p_A', name: 'Arbeitspreis je kWh', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'verbrauch', symbol: 'E', name: 'Verbrauch', dimension: 'energy', defaultUnit: 'kWh' },
    {
      id: 'leistungspreis',
      symbol: 'p_L',
      name: 'Leistungspreis je kW',
      dimension: 'currency',
      defaultUnit: 'EUR',
      hinweis: '0 eingeben, falls kein separater Leistungspreis anfällt',
    },
    { id: 'leistung', symbol: 'P', name: 'Bezogene Leistung', dimension: 'power', defaultUnit: 'kW', hinweis: '0 eingeben, falls kein separater Leistungspreis anfällt' },
    { id: 'kosten', symbol: 'K', name: 'Stromkosten', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['kosten'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'kosten') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const verbrauchKwh = bekannt.verbrauch / 3.6e6
    const leistungKw = bekannt.leistung / 1000
    return { kosten: bekannt.arbeitspreis * verbrauchKwh + bekannt.leistungspreis * leistungKw }
  },
  gueltigkeit: 'Übliches Zwei-Komponenten-Strompreismodell (Arbeits- und Leistungspreis) für Industriekunden',
  annahmen: ['Keine gestaffelten Tarife oder Spitzenlastfenster berücksichtigt'],
  quelle: { werk: 'Eigene Herleitung aus Arbeits- und Leistungspreis', unsicher: true },
  beispiel: {
    // Verbrauch=50000 kWh=1,8e11 J, Arbeitspreis=0,30 €/kWh, kein Leistungspreis
    // Kosten = 50000*0,30 = 15000 €
    bekannt: { arbeitspreis: 0.3, verbrauch: 1.8e11, leistungspreis: 0, leistung: 0 },
    ziel: 'kosten',
    erwartet: { kosten: 15000 },
    toleranzRelativ: 1e-9,
  },
}
