import type { Formula } from '../../types/formula'

export const brennstoffbedarf: Formula = {
  id: 'brennstoffbedarf',
  name: 'Brennstoffbedarf aus Nutzwärme',
  kategorie: 'Energie & Kosten',
  stichworte: ['brennstoffbedarf', 'kesselwirkungsgrad', 'nutzwärme'],
  latex: 'Q_{Brennstoff} = \\dfrac{Q_{Nutz}}{\\eta_{Kessel}}',
  variablen: [
    { id: 'Qnutz', symbol: 'Q_{Nutz}', name: 'Nutzwärme', dimension: 'energy', defaultUnit: 'kWh' },
    { id: 'eta', symbol: '\\eta_{Kessel}', name: 'Kesselwirkungsgrad', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1 },
    { id: 'Qbrennstoff', symbol: 'Q_{Brennstoff}', name: 'Brennstoffbedarf', dimension: 'energy', defaultUnit: 'kWh' },
  ],
  zielgroessen: ['Qbrennstoff', 'Qnutz', 'eta'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'Qbrennstoff') {
      if (bekannt.eta <= 0) throw new Error('Wirkungsgrad muss größer 0 sein')
      return { Qbrennstoff: bekannt.Qnutz / bekannt.eta }
    }
    if (ziel === 'Qnutz') return { Qnutz: bekannt.Qbrennstoff * bekannt.eta }
    if (ziel === 'eta') {
      if (bekannt.Qbrennstoff <= 0) throw new Error('Brennstoffbedarf muss größer 0 sein')
      return { eta: bekannt.Qnutz / bekannt.Qbrennstoff }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Feuerungsanlagen mit über den Betrachtungszeitraum konstantem Kesselwirkungsgrad',
  annahmen: ['Wirkungsgrad bezieht sich auf denselben Energiebezug (Heizwert oder Brennwert) wie Q_Nutz'],
  quelle: { werk: 'VDI Wärmeatlas' },
  warnungen: (bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    const eta = ziel === 'eta' ? ergebnis.eta : bekannt.eta
    if (eta !== undefined && eta > 1) warnungen.push('Wirkungsgrad über 100% ist nicht plausibel (außer bei Brennwertbezug mit Kondensationsnutzung).')
    return warnungen
  },
  beispiel: {
    // Qnutz=100000 kWh=3,6e11 J, η=0,88 -> QBrennstoff=113636,36 kWh=4,0909...e11 J
    bekannt: { Qnutz: 3.6e11, eta: 0.88 },
    ziel: 'Qbrennstoff',
    erwartet: { Qbrennstoff: 409090909090.9 },
    toleranzRelativ: 1e-6,
  },
}
