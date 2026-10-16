import type { Formula } from '../../types/formula'
import { G } from '../../units'

export const pumpenleistung: Formula = {
  id: 'pumpenleistung',
  name: 'Pumpenleistung',
  kategorie: 'Pumpen',
  stichworte: ['pumpenleistung', 'wellenleistung', 'hydraulische leistung', 'wirkungsgrad'],
  latex: 'P_{hyd} = \\rho \\, g \\, \\dot{V} \\, H \\qquad P_W = \\dfrac{P_{hyd}}{\\eta_P} \\qquad P_{el} = \\dfrac{P_W}{\\eta_M}',
  variablen: [
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    { id: 'V_dot', symbol: '\\dot{V}', name: 'Volumenstrom', dimension: 'volumeFlow', defaultUnit: 'm3h' },
    { id: 'H', symbol: 'H', name: 'Förderhöhe', dimension: 'length', defaultUnit: 'm' },
    { id: 'etaP', symbol: '\\eta_P', name: 'Pumpenwirkungsgrad', dimension: 'dimensionless', defaultUnit: 'pct', min: 0, max: 1 },
    { id: 'etaM', symbol: '\\eta_M', name: 'Motorwirkungsgrad', dimension: 'dimensionless', defaultUnit: 'pct', min: 0, max: 1 },
    { id: 'Phyd', symbol: 'P_{hyd}', name: 'Hydraulische Leistung', dimension: 'power', defaultUnit: 'kW' },
    { id: 'PWelle', symbol: 'P_W', name: 'Wellenleistung', dimension: 'power', defaultUnit: 'kW' },
    { id: 'Pel', symbol: 'P_{el}', name: 'Elektrische Leistung', dimension: 'power', defaultUnit: 'kW' },
  ],
  zielgroessen: ['Pel'],
  zusatzAusgaben: ['PWelle', 'Phyd'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'Pel') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.etaP <= 0 || bekannt.etaM <= 0) throw new Error('Wirkungsgrade müssen größer 0 sein')
    const Phyd = bekannt.rho * G * bekannt.V_dot * bekannt.H
    const PWelle = Phyd / bekannt.etaP
    const Pel = PWelle / bekannt.etaM
    return { Phyd, PWelle, Pel }
  },
  gueltigkeit: 'Stationärer Betriebspunkt, Wirkungsgrade für diesen Punkt bekannt (z. B. aus Datenblatt)',
  annahmen: ['Wirkungsgrade gelten exakt für den betrachteten Betriebspunkt, nicht pauschal über den ganzen Kennlinienbereich'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau' },
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.etaP > 1 || bekannt.etaM > 1) warnungen.push('Wirkungsgrad über 100% ist nicht plausibel.')
    return warnungen
  },
  beispiel: {
    // ρ=1000, V̇=0,05 m³/s, H=30m, ηP=0,75, ηM=0,92
    bekannt: { rho: 1000, V_dot: 0.05, H: 30, etaP: 0.75, etaM: 0.92 },
    ziel: 'Pel',
    erwartet: { Phyd: 14709.975, PWelle: 19613.3, Pel: 21318.8043 },
    toleranzRelativ: 1e-5,
  },
}
