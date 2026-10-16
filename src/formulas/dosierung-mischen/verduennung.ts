import type { Formula } from '../../types/formula'

export const verduennung: Formula = {
  id: 'verduennung',
  name: 'Verdünnung',
  kategorie: 'Dosierung & Mischen',
  stichworte: ['verdünnung', 'konzentration', 'verdünnungsreihe'],
  latex: 'c_1 \\cdot V_1 = c_2 \\cdot V_2',
  variablen: [
    { id: 'c1', symbol: 'c_1', name: 'Ausgangskonzentration', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'V1', symbol: 'V_1', name: 'Ausgangsvolumen', dimension: 'volume', defaultUnit: 'ml' },
    { id: 'c2', symbol: 'c_2', name: 'Zielkonzentration', dimension: 'dimensionless', defaultUnit: 'pct' },
    { id: 'V2', symbol: 'V_2', name: 'Zielvolumen', dimension: 'volume', defaultUnit: 'ml' },
  ],
  zielgroessen: ['V2', 'V1', 'c1', 'c2'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'V2') {
      if (bekannt.c2 === 0) throw new Error('Zielkonzentration darf nicht 0 sein')
      return { V2: (bekannt.c1 * bekannt.V1) / bekannt.c2 }
    }
    if (ziel === 'V1') {
      if (bekannt.c1 === 0) throw new Error('Ausgangskonzentration darf nicht 0 sein')
      return { V1: (bekannt.c2 * bekannt.V2) / bekannt.c1 }
    }
    if (ziel === 'c1') {
      if (bekannt.V1 === 0) throw new Error('Ausgangsvolumen darf nicht 0 sein')
      return { c1: (bekannt.c2 * bekannt.V2) / bekannt.V1 }
    }
    if (ziel === 'c2') {
      if (bekannt.V2 === 0) throw new Error('Zielvolumen darf nicht 0 sein')
      return { c2: (bekannt.c1 * bekannt.V1) / bekannt.V2 }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Verdünnen einer Lösung ohne Stoffumsatz (die gelöste Stoffmenge bleibt erhalten)',
  annahmen: ['Keine Volumenkontraktion beim Mischen mit dem Lösungsmittel'],
  quelle: { werk: 'Eigene Herleitung aus der Stoffmengenbilanz' },
  warnungen: (bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    const v2 = ziel === 'V2' ? ergebnis.V2 : bekannt.V2
    const v1 = ziel === 'V1' ? ergebnis.V1 : bekannt.V1
    if (v2 !== undefined && v1 !== undefined && v2 < v1) {
      warnungen.push('Zielvolumen ist kleiner als das Ausgangsvolumen - das wäre ein Aufkonzentrieren, keine Verdünnung.')
    }
    return warnungen
  },
  beispiel: {
    // c1=0,96 (96%), V1=50 ml=5e-5 m³, c2=0,10 (10%) -> V2 = 0,96*5e-5/0,10 = 4,8e-4 m³ = 480 ml
    bekannt: { c1: 0.96, V1: 5e-5, c2: 0.1 },
    ziel: 'V2',
    erwartet: { V2: 4.8e-4 },
    toleranzRelativ: 1e-9,
  },
}
