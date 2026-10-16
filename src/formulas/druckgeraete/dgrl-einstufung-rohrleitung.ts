import type { Formula } from '../../types/formula'
import { DRUCKGERAETE_HINWEIS } from './hinweis'

function diagrammBeschreibung(zustand: number, fluidgruppe: number): string {
  const medium = zustand >= 1.5 ? 'Flüssigkeiten' : 'Gase/Dämpfe'
  const gruppe = fluidgruppe >= 1.5 ? 2 : 1
  return `Zutreffendes Diagramm (Anhang II DGRL): Rohrleitungen, ${medium}, Fluidgruppe ${gruppe}`
}

export const dgrlEinstufungRohrleitung: Formula = {
  id: 'dgrl-einstufung-rohrleitung',
  name: 'DGRL-Einstufung Rohrleitung (PS·DN)',
  kategorie: 'Druckgeräte',
  stichworte: ['dgrl', 'druckgeräterichtlinie', 'einstufung', 'kategorie', 'ps dn', 'rohrleitung'],
  latex: 'PS \\cdot DN',
  variablen: [
    { id: 'PS', symbol: 'PS', name: 'Zulässiger Betriebsdruck', dimension: 'pressure', defaultUnit: 'bar' },
    {
      id: 'DN',
      symbol: 'DN',
      name: 'Nennweite (Zahlenwert, z. B. 50 für DN 50)',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 0,
    },
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
    { id: 'psDN', symbol: 'PS \\cdot DN', name: 'PS·DN', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['psDN'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'psDN') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const psBar = bekannt.PS / 1e5
    return { psDN: psBar * bekannt.DN, zustand: bekannt.zustand, fluidgruppe: bekannt.fluidgruppe }
  },
  gueltigkeit:
    'Nur die Kennzahl PS·DN (bar) und die Bestimmung, welches der neun Diagramme aus Anhang II grundsätzlich zutrifft, werden berechnet. Die vollständige Kategorieeinstufung (Kategorie I bis IV, Sonderfälle nach Art. 4 Abs. 3) ist NICHT implementiert, weil die genauen Grenzlinien aller Diagramme nicht mit ausreichender Sicherheit vorlagen - das muss gegen Anhang II der Richtlinie 2014/68/EU selbst geprüft werden.',
  annahmen: [
    DRUCKGERAETE_HINWEIS,
    'DN wird als reiner Zahlenwert eingegeben (z. B. 50 für DN 50), nicht als Länge',
    'Zustand: 1 = Gase/Dämpfe, 2 = Flüssigkeiten (bei Werten dazwischen wird gerundet)',
    'Fluidgruppe: 1 = gefährlich nach Art. 13(1) DGRL, 2 = ungefährlich',
    'Es wird keine Kategorie (I-IV) ausgegeben, nur PS·DN und das zutreffende Diagramm benannt',
  ],
  quelle: { werk: 'Richtlinie 2014/68/EU (DGRL)', kapitel: 'Anhang II', unsicher: true },
  empfehlung: (ergebnis) =>
    `PS·DN = ${ergebnis.psDN.toFixed(3)} bar. ${diagrammBeschreibung(ergebnis.zustand, ergebnis.fluidgruppe)} - volle Kategorieeinstufung (I-IV) hier nicht bewertet, siehe Gültigkeitsbereich.`,
  beispiel: {
    // PS=25 bar=2,5e6 Pa, DN=80, Gas, Fluidgruppe 1 -> psDN=25*80=2000
    bekannt: { PS: 2.5e6, DN: 80, zustand: 1, fluidgruppe: 1 },
    ziel: 'psDN',
    erwartet: { psDN: 2000 },
    toleranzRelativ: 1e-6,
  },
}
