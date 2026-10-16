import type { Formula } from '../../types/formula'

export const dampfbedarfAufheizen: Formula = {
  id: 'dampfbedarf-aufheizen',
  name: 'Dampfbedarf zum Aufheizen',
  kategorie: 'Dampf (IAPWS-IF97)',
  stichworte: ['dampfbedarf', 'aufheizen', 'kondensat', 'massenstrom'],
  latex: '\\dot{m}_D = \\dfrac{\\dot{Q}}{h_{Dampf} - h_{Kondensat}}',
  variablen: [
    { id: 'Q_dot', symbol: '\\dot{Q}', name: 'Wärmestrom', dimension: 'power', defaultUnit: 'kW' },
    { id: 'hDampf', symbol: 'h_{Dampf}', name: 'Spez. Enthalpie Dampf', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'hKondensat', symbol: 'h_{Kondensat}', name: 'Spez. Enthalpie Kondensat', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'm_dot_D', symbol: '\\dot{m}_D', name: 'Dampfbedarf', dimension: 'massFlow', defaultUnit: 'kgh' },
  ],
  zielgroessen: ['m_dot_D', 'Q_dot'],
  compute: (bekannt, ziel): Record<string, number> => {
    const dh = bekannt.hDampf - bekannt.hKondensat
    if (ziel === 'm_dot_D') {
      if (dh <= 0) throw new Error('Enthalpie des Dampfes muss größer als die des Kondensats sein')
      return { m_dot_D: bekannt.Q_dot / dh }
    }
    if (ziel === 'Q_dot') return { Q_dot: bekannt.m_dot_D * dh }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Stationärer Aufheizvorgang, Dampf kondensiert vollständig und verlässt den Apparat als Kondensat',
  annahmen: [
    'h_Dampf und h_Kondensat z. B. über "Sattdampftafel" oder "Wasser, Zustand" ermitteln und per Ergebnis übernehmen einsetzen',
    'Keine Wärmeverluste an die Umgebung',
  ],
  quelle: { werk: 'VDI Wärmeatlas', kapitel: 'Energiebilanz Dampf-Wasser-Wärmeübertrager' },
  beispiel: {
    // Q̇=500 kW, hDampf=2750 kJ/kg (leicht überhitzt), hKondensat=420 kJ/kg
    // ṁ_D = 500000/(2750000-420000) = 0,2146... kg/s
    bekannt: { Q_dot: 500000, hDampf: 2750000, hKondensat: 420000 },
    ziel: 'm_dot_D',
    erwartet: { m_dot_D: 0.214592275 },
    toleranzRelativ: 1e-6,
  },
}
