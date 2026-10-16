import type { Formula } from '../../types/formula'

export const drehzahlDrosselVergleich: Formula = {
  id: 'drehzahl-drossel-vergleich',
  name: 'Drosselregelung gegen Drehzahlregelung',
  kategorie: 'Pumpen',
  stichworte: ['drosselregelung', 'drehzahlregelung', 'frequenzumrichter', 'energieeinsparung'],
  latex: 'P_{Drehzahl,2} = P_1 \\left(\\dfrac{\\dot{V}_2}{\\dot{V}_1}\\right)^3 \\qquad P_{Drossel,2} \\approx P_1',
  variablen: [
    { id: 'V1', symbol: '\\dot{V}_1', name: 'Volumenstrom bei Volllast', dimension: 'volumeFlow', defaultUnit: 'm3h' },
    { id: 'P1', symbol: 'P_1', name: 'Leistung bei Volllast', dimension: 'power', defaultUnit: 'kW' },
    { id: 'V2', symbol: '\\dot{V}_2', name: 'Reduzierter Zielvolumenstrom', dimension: 'volumeFlow', defaultUnit: 'm3h' },
    { id: 'betriebsstunden', symbol: 't_B', name: 'Betriebsstunden pro Jahr bei reduziertem Volumenstrom', dimension: 'time', defaultUnit: 'h' },
    { id: 'strompreis', symbol: 'p_{el}', name: 'Strompreis je kWh', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'pDrehzahl2', symbol: 'P_{Drehzahl,2}', name: 'Leistung bei Drehzahlregelung', dimension: 'power', defaultUnit: 'kW' },
    { id: 'einsparungEuroJahr', symbol: 'K_a', name: 'Energiekosteneinsparung pro Jahr', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['einsparungEuroJahr'],
  zusatzAusgaben: ['pDrehzahl2'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'einsparungEuroJahr') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.V1 === 0) throw new Error('V̇₁ darf nicht 0 sein')
    const pDrehzahl2 = bekannt.P1 * (bekannt.V2 / bekannt.V1) ** 3
    const pDrossel2 = bekannt.P1 // vereinfachende Annahme, siehe "annahmen"
    const einsparungW = pDrossel2 - pDrehzahl2
    const betriebsstundenH = bekannt.betriebsstunden / 3600
    const einsparungEuroJahr = (einsparungW / 1000) * betriebsstundenH * bekannt.strompreis
    return { einsparungEuroJahr, pDrehzahl2 }
  },
  gueltigkeit: 'Kreiselpumpe mit relativ flacher Kennlinie im betrachteten Bereich, Vergleich für einen einzelnen reduzierten Betriebspunkt',
  annahmen: [
    'Bei Drosselregelung wird die Pumpenleistung näherungsweise als unverändert gegenüber Volllast angenommen (Kreiselpumpen-Kennlinien sind im Teillastbereich oft relativ flach) - für eine genaue Aussage die reale Pumpenkennlinie verwenden',
    'Bei Drehzahlregelung gilt das Affinitätsgesetz P ~ n³ ~ V̇³ bei ähnlichem Betriebspunkt',
  ],
  richtwert: true,
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau', unsicher: true },
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.V2 > bekannt.V1) warnungen.push('Zielvolumenstrom V̇₂ ist größer als der Volllast-Volumenstrom V̇₁ - Eingabe prüfen.')
    return warnungen
  },
  beispiel: {
    // V1=180 m³/h=0,05 m³/s, P1=15000W, V2=108 m³/h=0,03 m³/s, tB=4000h=14400000s, Preis=0,20€/kWh
    bekannt: { V1: 0.05, P1: 15000, V2: 0.03, betriebsstunden: 14400000, strompreis: 0.2 },
    ziel: 'einsparungEuroJahr',
    erwartet: { einsparungEuroJahr: 9408, pDrehzahl2: 3240 },
    toleranzRelativ: 1e-5,
  },
}
