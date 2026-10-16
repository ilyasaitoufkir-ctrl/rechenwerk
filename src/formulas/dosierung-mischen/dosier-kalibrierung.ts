import type { Formula } from '../../types/formula'

export const dosierKalibrierung: Formula = {
  id: 'dosier-kalibrierung',
  name: 'Dosierkalibrierung',
  kategorie: 'Dosierung & Mischen',
  stichworte: ['dosierung', 'kalibrierung', 'abweichung', 'korrekturfaktor'],
  latex: 'Abw. = \\dfrac{Ist - Soll}{Soll} \\cdot 100\\,\\% \\qquad f_{Korr} = \\dfrac{Soll}{Ist}',
  variablen: [
    { id: 'sollVolumen', symbol: 'V_{Soll}', name: 'Sollmenge', dimension: 'volume', defaultUnit: 'ml' },
    { id: 'istVolumen', symbol: 'V_{Ist}', name: 'Istmenge (gemessen)', dimension: 'volume', defaultUnit: 'ml' },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    { id: 'abweichung', symbol: 'Abw.', name: 'Abweichung', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'korrekturfaktor', symbol: 'f_{Korr}', name: 'Korrekturfaktor', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'sollMasse', symbol: 'm_{Soll}', name: 'Sollmasse', dimension: 'mass', defaultUnit: 'kg' },
    { id: 'istMasse', symbol: 'm_{Ist}', name: 'Istmasse', dimension: 'mass', defaultUnit: 'kg' },
  ],
  zielgroessen: ['abweichung'],
  zusatzAusgaben: ['korrekturfaktor', 'sollMasse', 'istMasse'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'abweichung') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.sollVolumen === 0) throw new Error('Sollmenge darf nicht 0 sein')
    if (bekannt.istVolumen === 0) throw new Error('Istmenge darf nicht 0 sein')
    // SI der Dimension 'dimensionless' ist die reine Zahl (Anteil), nicht der Prozentwert -
    // die Anzeige in % übernimmt die Einheitenwahl (defaultUnit 'pct')
    const abweichung = (bekannt.istVolumen - bekannt.sollVolumen) / bekannt.sollVolumen
    const korrekturfaktor = bekannt.sollVolumen / bekannt.istVolumen
    return {
      abweichung,
      korrekturfaktor,
      sollMasse: bekannt.sollVolumen * bekannt.rho,
      istMasse: bekannt.istVolumen * bekannt.rho,
    }
  },
  gueltigkeit: 'Kalibrierung einer Dosiereinrichtung über eine Ausliterung (Soll- gegen Istmenge)',
  annahmen: ['Dichte über den Dosierbereich konstant', 'Korrekturfaktor gilt nur für den kalibrierten Einstellpunkt'],
  quelle: { werk: 'Eigene Herleitung' },
  beispiel: {
    // Soll=100 ml=1e-4 m³, Ist=104 ml=1,04e-4 m³, ρ=1000 kg/m³
    // Abw. = (104-100)/100 = 0,04 (= 4%), fKorr=100/104=0,961538
    bekannt: { sollVolumen: 1e-4, istVolumen: 1.04e-4, rho: 1000 },
    ziel: 'abweichung',
    erwartet: { abweichung: 0.04, korrekturfaktor: 0.961538, sollMasse: 0.1, istMasse: 0.104 },
    toleranzRelativ: 1e-4,
  },
}
