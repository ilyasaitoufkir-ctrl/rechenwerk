import type { Formula } from '../../types/formula'

export const verdraengerpumpe: Formula = {
  id: 'verdraengerpumpe',
  name: 'Verdränger- und Dosierpumpe',
  kategorie: 'Pumpen',
  stichworte: ['verdrängerpumpe', 'dosierpumpe', 'hubvolumen', 'volumetrischer wirkungsgrad'],
  latex: '\\dot{V} = V_{Hub} \\cdot n \\cdot \\eta_{vol}',
  variablen: [
    { id: 'VHub', symbol: 'V_{Hub}', name: 'Hubvolumen', dimension: 'volume', defaultUnit: 'ml' },
    { id: 'n', symbol: 'n', name: 'Hubfrequenz/Drehzahl', dimension: 'frequency', defaultUnit: 'rpm' },
    { id: 'etaVol', symbol: '\\eta_{vol}', name: 'Volumetrischer Wirkungsgrad', dimension: 'dimensionless', defaultUnit: 'pct', min: 0, max: 1 },
    { id: 'V_dot', symbol: '\\dot{V}', name: 'Volumenstrom', dimension: 'volumeFlow', defaultUnit: 'lh' },
  ],
  zielgroessen: ['V_dot', 'VHub', 'n', 'etaVol'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 'V_dot') return { V_dot: bekannt.VHub * bekannt.n * bekannt.etaVol }
    if (ziel === 'VHub') {
      if (bekannt.n * bekannt.etaVol === 0) throw new Error('n · η_vol darf nicht 0 sein')
      return { VHub: bekannt.V_dot / (bekannt.n * bekannt.etaVol) }
    }
    if (ziel === 'n') {
      if (bekannt.VHub * bekannt.etaVol === 0) throw new Error('V_Hub · η_vol darf nicht 0 sein')
      return { n: bekannt.V_dot / (bekannt.VHub * bekannt.etaVol) }
    }
    if (ziel === 'etaVol') {
      if (bekannt.VHub * bekannt.n === 0) throw new Error('V_Hub · n darf nicht 0 sein')
      return { etaVol: bekannt.V_dot / (bekannt.VHub * bekannt.n) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Oszillierende oder rotierende Verdrängerpumpen (Membran-, Kolben-, Zahnradpumpen) im stationären Betrieb',
  annahmen: ['Volumetrischer Wirkungsgrad über den Betriebspunkt konstant (Leckage, Kompressibilität des Fördermediums darin zusammengefasst)'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau' },
  warnungen: (bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    const eta = ziel === 'etaVol' ? ergebnis.etaVol : bekannt.etaVol
    if (eta !== undefined && eta > 1) warnungen.push('Volumetrischer Wirkungsgrad über 100% ist nicht plausibel.')
    return warnungen
  },
  beispiel: {
    // VHub=10 ml=1e-5 m³, n=100 1/min=1,66667 1/s, ηvol=0,95
    // V̇ = 1e-5*1,66667*0,95 = 1,58333e-5 m³/s
    bekannt: { VHub: 1e-5, n: 100 / 60, etaVol: 0.95 },
    ziel: 'V_dot',
    erwartet: { V_dot: 1.583333e-5 },
    toleranzRelativ: 1e-5,
  },
}
