import type { Formula } from '../../types/formula'

export const grundlastquote: Formula = {
  id: 'grundlastquote',
  name: 'Grundlastquote',
  kategorie: 'Energie & Kosten',
  stichworte: ['grundlast', 'quote', 'lastgang', 'energiebilanz'],
  latex: 'q_{GL} = \\dfrac{E_{GL}}{E_{ges}}',
  variablen: [
    {
      id: 'eGrundlast',
      symbol: 'E_{GL}',
      name: 'Grundlastenergie',
      dimension: 'energy',
      defaultUnit: 'kWh',
      hinweis: 'Z. B. über "Grundlastenergie aus Leistung" berechnen oder direkt aus zwei Zählerständen (Differenz) eingeben',
    },
    { id: 'eGesamt', symbol: 'E_{ges}', name: 'Gesamtverbrauch im Zeitraum', dimension: 'energy', defaultUnit: 'kWh' },
    { id: 'quote', symbol: 'q_{GL}', name: 'Grundlastquote', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['quote'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'quote') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.eGesamt <= 0) throw new Error('Gesamtverbrauch muss größer 0 sein')
    return { quote: bekannt.eGrundlast / bekannt.eGesamt }
  },
  gueltigkeit: 'Verhältnis zweier Energiemengen im selben Zeitraum',
  annahmen: ['Grundlastenergie und Gesamtverbrauch beziehen sich auf denselben Zeitraum'],
  quelle: { werk: 'Eigene Herleitung', unsicher: true },
  warnungen: (_bekannt, _ziel, ergebnis) => {
    const warnungen: string[] = []
    if (ergebnis.quote > 1) {
      warnungen.push('Grundlastquote über 100% - Grundlastenergie kann nicht größer als der Gesamtverbrauch sein.')
    }
    return warnungen
  },
  beispiel: {
    // Grundlastenergie=40000 kWh=1,44e11 J, Gesamtverbrauch=100000 kWh=3,6e11 J -> Quote=0,4
    bekannt: { eGrundlast: 1.44e11, eGesamt: 3.6e11 },
    ziel: 'quote',
    erwartet: { quote: 0.4 },
    toleranzRelativ: 1e-9,
  },
}
