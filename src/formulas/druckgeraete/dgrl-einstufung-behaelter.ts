import type { Formula } from '../../types/formula'
import { DRUCKGERAETE_HINWEIS } from './hinweis'

function diagrammBeschreibung(zustand: number, fluidgruppe: number): string {
  const medium = zustand >= 1.5 ? 'Flüssigkeiten' : 'Gase/Dämpfe'
  const gruppe = fluidgruppe >= 1.5 ? 2 : 1
  return `Zutreffendes Diagramm (Anhang II DGRL): Behälter, ${medium}, Fluidgruppe ${gruppe}`
}

export const dgrlEinstufungBehaelter: Formula = {
  id: 'dgrl-einstufung-behaelter',
  name: 'DGRL-Einstufung Behälter (PS·V)',
  kategorie: 'Druckgeräte',
  stichworte: ['dgrl', 'druckgeräterichtlinie', 'einstufung', 'kategorie', 'ps v', 'behälter'],
  latex: 'PS \\cdot V',
  variablen: [
    { id: 'PS', symbol: 'PS', name: 'Zulässiger Betriebsdruck', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'V', symbol: 'V', name: 'Volumen', dimension: 'volume', defaultUnit: 'l' },
    {
      id: 'zustand',
      symbol: 'Z',
      name: 'Aggregatzustand',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 1,
      max: 2,
      hinweis: '1 = Gase/Dämpfe, 2 = Flüssigkeiten',
    },
    {
      id: 'fluidgruppe',
      symbol: 'G',
      name: 'Fluidgruppe',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 1,
      max: 2,
      hinweis: '1 = gefährlich (Art. 13 Abs. 1), 2 = ungefährlich',
    },
    { id: 'psV', symbol: 'PS \\cdot V', name: 'PS·V', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['psV'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'psV') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const psBar = bekannt.PS / 1e5
    const vLiter = bekannt.V * 1000
    // zustand/fluidgruppe als Durchreiche, damit empfehlung() (sieht nur das compute()-Ergebnis) sie lesen kann
    return { psV: psBar * vLiter, zustand: bekannt.zustand, fluidgruppe: bekannt.fluidgruppe }
  },
  gueltigkeit:
    'Nur die Kennzahl PS·V (bar·Liter) und die Bestimmung, welches der neun Diagramme aus Anhang II grundsätzlich zutrifft, werden berechnet. Die vollständige Kategorieeinstufung (Kategorie I bis IV, Sonderfälle nach Art. 4 Abs. 3) ist NICHT implementiert, weil die genauen Grenzlinien aller Diagramme nicht mit ausreichender Sicherheit vorlagen - das muss gegen Anhang II der Richtlinie 2014/68/EU selbst geprüft werden.',
  annahmen: [
    DRUCKGERAETE_HINWEIS,
    'Zustand: 1 = Gase/Dämpfe, 2 = Flüssigkeiten (bei Werten dazwischen wird gerundet)',
    'Fluidgruppe: 1 = gefährlich nach Art. 13(1) DGRL, 2 = ungefährlich',
    'Es wird keine Kategorie (I-IV) ausgegeben, nur PS·V und das zutreffende Diagramm benannt',
  ],
  quelle: { werk: 'Richtlinie 2014/68/EU (DGRL)', kapitel: 'Anhang II', unsicher: true },
  empfehlung: (ergebnis) =>
    `PS·V = ${ergebnis.psV.toFixed(3)} bar·l. ${diagrammBeschreibung(ergebnis.zustand, ergebnis.fluidgruppe)} - volle Kategorieeinstufung (I-IV) hier nicht bewertet, siehe Gültigkeitsbereich.`,
  beispiel: {
    // PS=10 bar=1e6 Pa, V=500 l=0,5 m³, Gas (zustand=1), Fluidgruppe 2
    // psV = 10*500 = 5000 bar*l
    bekannt: { PS: 1e6, V: 0.5, zustand: 1, fluidgruppe: 2 },
    ziel: 'psV',
    erwartet: { psV: 5000 },
    toleranzRelativ: 1e-6,
  },
}
