import type { Formula } from '../../types/formula'
import { DRUCKGERAETE_HINWEIS } from './hinweis'

export const zylinderschaleAd2000B1: Formula = {
  id: 'zylinderschale-ad2000-b1',
  name: 'Zylinderschale unter Innendruck (AD 2000-Merkblatt B1)',
  kategorie: 'Druckgeräte',
  stichworte: ['zylinderschale', 'wanddicke', 'druckbehälter', 'ad 2000', 'b1', 'innendruck'],
  latex: 's = \\dfrac{D_a \\, p}{20 \\, \\frac{K}{S} \\, v + p} + c_1 + c_2',
  variablen: [
    { id: 'p', symbol: 'p', name: 'Berechnungsdruck', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'Da', symbol: 'D_a', name: 'Außendurchmesser', dimension: 'length', defaultUnit: 'mm' },
    {
      id: 'K',
      symbol: 'K',
      name: 'Festigkeitskennwert',
      dimension: 'pressure',
      defaultUnit: 'MPa',
      hinweis: 'Aus Werkstoffnorm oder Datenblatt bei Berechnungstemperatur - keine Tabelle hinterlegt',
    },
    { id: 'S', symbol: 'S', name: 'Sicherheitsbeiwert', dimension: 'dimensionless', defaultUnit: '_', min: 1 },
    { id: 'v', symbol: 'v', name: 'Schweißnahtfaktor', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'c1', symbol: 'c_1', name: 'Zuschlag Wanddickenunterschreitung (Herstelltoleranz)', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 'c2', symbol: 'c_2', name: 'Korrosionszuschlag', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 's', symbol: 's', name: 'Wanddicke', dimension: 'length', defaultUnit: 'mm' },
  ],
  zielgroessen: ['s', 'p'],
  compute: (bekannt, ziel): Record<string, number> => {
    // Die Konstante "20" in der AD-2000-Formel ist NICHT einheitenunabhängig - sie gilt nur
    // für p in bar und K in N/mm². Deshalb hier explizit aus SI (Pa) um- statt direkt zu rechnen.
    const pBar = bekannt.p / 1e5
    const kNmm2 = bekannt.K / 1e6
    if (bekannt.S <= 0) throw new Error('Sicherheitsbeiwert S muss größer 0 sein')

    if (ziel === 's') {
      const sMm = (bekannt.Da * 1000 * pBar) / (20 * (kNmm2 / bekannt.S) * bekannt.v + pBar)
      const s = sMm / 1000 + bekannt.c1 + bekannt.c2
      return { s }
    }
    if (ziel === 'p') {
      const sOhneZuschlagMm = (bekannt.s - bekannt.c1 - bekannt.c2) * 1000
      if (sOhneZuschlagMm <= 0) throw new Error('Wanddicke abzüglich Zuschläge muss größer 0 sein')
      // s' = Da·p/(20·K/S·v+p)  =>  p = s'·20·K/S·v / (Da - s')
      const nennerMm = bekannt.Da * 1000 - sOhneZuschlagMm
      if (nennerMm <= 0) throw new Error('Wanddicke abzüglich Zuschläge muss kleiner als der Außendurchmesser sein')
      const pBarErgebnis = (sOhneZuschlagMm * 20 * (kNmm2 / bekannt.S) * bekannt.v) / nennerMm
      return { p: pBarErgebnis * 1e5 }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit:
    'Zylindrische Schale unter innerem Überdruck nach AD 2000-Merkblatt B1. Die in B1 zusätzlich festgelegte Anwendungsgrenze für das Verhältnis Da/Di wurde hier NICHT geprüft - das muss zusätzlich gegen das Merkblatt verifiziert werden.',
  annahmen: [
    DRUCKGERAETE_HINWEIS,
    'p in bar, K in N/mm² (= MPa) gemäß AD-2000-Konvention; die App rechnet intern in SI und rechnet beim Ein-/Ausgeben automatisch um',
    'K und S sind reine Eingaben, keine Tabellenwerte',
  ],
  quelle: { werk: 'AD 2000-Merkblatt B1' },
  beispiel: {
    // p=16 bar=1,6e6 Pa, Da=1010mm=1,01m, K=300 MPa=3e8 Pa, S=1,5, v=0,85, c1=1mm=0,001m, c2=0,8mm=0,0008m
    // In bar/N-mm²-Konvention: s_mm = 1010*16/(20*(300/1,5)*0,85+16) = 16160/3416 = 4,730679 mm
    // s = 4,730679mm + 1mm + 0,8mm = 6,530679 mm = 0,006530679 m
    bekannt: { p: 1.6e6, Da: 1.01, K: 3e8, S: 1.5, v: 0.85, c1: 0.001, c2: 0.0008 },
    ziel: 's',
    erwartet: { s: 0.006530679 },
    toleranzRelativ: 1e-4,
  },
}
