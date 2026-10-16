import type { Formula } from '../../types/formula'
import { DRUCKGERAETE_HINWEIS } from './hinweis'

export const pruefdruckDgrl: Formula = {
  id: 'pruefdruck-dgrl',
  name: 'Prüfdruck (DGRL 2014/68/EU)',
  kategorie: 'Druckgeräte',
  stichworte: ['prüfdruck', 'dgrl', 'druckgeräterichtlinie', 'druckprüfung', 'wasserdruckprüfung'],
  latex: 'P_T = \\max\\!\\left(1{,}25 \\cdot PS \\cdot \\dfrac{f_a}{f_t} \\, ; \\; 1{,}43 \\cdot PS\\right)',
  variablen: [
    { id: 'PS', symbol: 'PS', name: 'Zulässiger Betriebsdruck', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'fa', symbol: 'f_a', name: 'Zulässige Spannung bei Prüftemperatur', dimension: 'pressure', defaultUnit: 'MPa' },
    { id: 'ft', symbol: 'f_t', name: 'Zulässige Spannung bei Auslegungstemperatur', dimension: 'pressure', defaultUnit: 'MPa' },
    { id: 'PT', symbol: 'P_T', name: 'Prüfdruck', dimension: 'pressure', defaultUnit: 'bar' },
  ],
  zielgroessen: ['PT'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'PT') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.ft <= 0) throw new Error('f_t muss größer 0 sein')
    const PT = Math.max(1.25 * bekannt.PS * (bekannt.fa / bekannt.ft), 1.43 * bekannt.PS)
    return { PT }
  },
  gueltigkeit: 'Druckgeräte nach Richtlinie 2014/68/EU (DGRL), Flüssigkeitsdruckprüfung',
  annahmen: [DRUCKGERAETE_HINWEIS, 'f_a und f_t sind reine Eingaben, keine Tabellenwerte'],
  quelle: { werk: 'Richtlinie 2014/68/EU (DGRL)', kapitel: 'Anhang I, Nr. 7.4' },
  beispiel: {
    // PS=16 bar=1,6e6 Pa, fa=ft (gleiche Spannung) -> PT=max(1,25*16;1,43*16)=22,88 bar
    bekannt: { PS: 1.6e6, fa: 2e8, ft: 2e8 },
    ziel: 'PT',
    erwartet: { PT: 2.288e6 },
    toleranzRelativ: 1e-9,
  },
}
