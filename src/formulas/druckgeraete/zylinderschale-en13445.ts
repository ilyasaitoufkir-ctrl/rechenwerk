import type { Formula } from '../../types/formula'
import { DRUCKGERAETE_HINWEIS } from './hinweis'

export const zylinderschaleEn13445: Formula = {
  id: 'zylinderschale-en13445',
  name: 'Zylinderschale unter Innendruck (EN 13445-3)',
  kategorie: 'Druckgeräte',
  stichworte: ['zylinderschale', 'wanddicke', 'druckbehälter', 'en 13445', 'innendruck'],
  latex: 'e = \\dfrac{P \\, D_i}{2 f z - P}',
  variablen: [
    { id: 'P', symbol: 'P', name: 'Berechnungsdruck', dimension: 'pressure', defaultUnit: 'MPa' },
    { id: 'Di', symbol: 'D_i', name: 'Innendurchmesser', dimension: 'length', defaultUnit: 'mm' },
    {
      id: 'f',
      symbol: 'f',
      name: 'Berechnungsspannung',
      dimension: 'pressure',
      defaultUnit: 'MPa',
      hinweis: 'Aus Werkstoffnorm oder Datenblatt bei Berechnungstemperatur - keine Tabelle hinterlegt',
    },
    { id: 'z', symbol: 'z', name: 'Schweißnahtfaktor', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'c1', symbol: 'c_1', name: 'Zuschlag Wanddickenunterschreitung (Herstelltoleranz)', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 'c2', symbol: 'c_2', name: 'Korrosionszuschlag', dimension: 'length', defaultUnit: 'mm', min: 0 },
    { id: 'e', symbol: 'e', name: 'Mindestwanddicke (rechnerisch)', dimension: 'length', defaultUnit: 'mm' },
    { id: 'eBestell', symbol: 'e_{Bestell}', name: 'Bestellwanddicke (e + c1 + c2)', dimension: 'length', defaultUnit: 'mm' },
  ],
  zielgroessen: ['e', 'P'],
  zusatzAusgaben: ['eBestell'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'e') {
      if (bekannt.P >= 2 * bekannt.f * bekannt.z) {
        throw new Error('Druck P muss kleiner als 2·f·z sein (sonst keine endliche Wanddicke nach dieser Formel)')
      }
      const e = (bekannt.P * bekannt.Di) / (2 * bekannt.f * bekannt.z - bekannt.P)
      return { e, eBestell: e + bekannt.c1 + bekannt.c2 }
    }
    if (ziel === 'P') {
      if (bekannt.e <= 0) throw new Error('Wanddicke muss größer 0 sein')
      const P = (2 * bekannt.e * bekannt.f * bekannt.z) / (bekannt.Di + bekannt.e)
      return { P, eBestell: bekannt.e + bekannt.c1 + bekannt.c2 }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit:
    'Dünnwandige zylindrische Schale unter innerem Überdruck nach DIN EN 13445-3, Abschnitt 7.4.2. Die Formel selbst ist für das angegebene Druck-/Spannungsverhältnis exakt (P < 2fz); weitergehende, in der Norm ggf. zusätzlich festgelegte Dicken-/Durchmesser-Anwendungsgrenzen wurden hier NICHT geprüft - das muss zusätzlich gegen die Norm verifiziert werden.',
  annahmen: [
    DRUCKGERAETE_HINWEIS,
    'f (Berechnungsspannung) und z (Schweißnahtfaktor) sind reine Eingaben, keine Tabellenwerte',
    'c1 und c2 (Zuschläge) werden nur addiert, nicht in die Druck-/Spannungsrechnung selbst einbezogen',
  ],
  quelle: { werk: 'DIN EN 13445-3', kapitel: 'Abschnitt 7.4.2' },
  warnungen: (bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    const e = ziel === 'e' ? ergebnis.e : bekannt.e
    if (e !== undefined && bekannt.Di > 0 && e / bekannt.Di > 0.16) {
      warnungen.push(
        'e/Di liegt über 0,16 - das legt nahe, dass die dünnwandige Schalentheorie an ihre Grenzen stößt. Anwendbarkeit unbedingt gegen die Norm prüfen.',
      )
    }
    return warnungen
  },
  beispiel: {
    // P=1,6 MPa=1,6e6 Pa, Di=1000mm=1m, f=200 MPa=2e8 Pa, z=1,0, c1=1mm=0,001m, c2=0,8mm=0,0008m
    // e = 1,6e6*1/(2*2e8*1-1,6e6) = 0,004016064 m = 4,016064 mm
    bekannt: { P: 1.6e6, Di: 1, f: 200e6, z: 1, c1: 0.001, c2: 0.0008 },
    ziel: 'e',
    erwartet: { e: 0.004016064, eBestell: 0.005816064 },
    toleranzRelativ: 1e-5,
  },
}
