import type { Formula } from '../../types/formula'

export const fuellEntleerzeit: Formula = {
  id: 'fuell-entleerzeit',
  name: 'Füll- und Entleerzeit',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['füllzeit', 'entleerzeit', 'behälter', 'volumenstrom'],
  latex: 't = \\dfrac{V}{\\dot{V}}',
  variablen: [
    { id: 'V', symbol: 'V', name: 'Volumen', dimension: 'volume', defaultUnit: 'm3' },
    {
      id: 'V_dot',
      symbol: '\\dot{V}',
      name: 'Volumenstrom',
      dimension: 'volumeFlow',
      defaultUnit: 'm3h',
    },
    { id: 't', symbol: 't', name: 'Zeit', dimension: 'time', defaultUnit: 'min' },
  ],
  zielgroessen: ['t', 'V', 'V_dot'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel === 't') {
      if (bekannt.V_dot === 0) throw new Error('Volumenstrom darf nicht 0 sein')
      return { t: bekannt.V / bekannt.V_dot }
    }
    if (ziel === 'V') {
      return { V: bekannt.V_dot * bekannt.t }
    }
    if (ziel === 'V_dot') {
      if (bekannt.t === 0) throw new Error('Zeit darf nicht 0 sein')
      return { V_dot: bekannt.V / bekannt.t }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Konstanter Volumenstrom über die gesamte Füll-/Entleerzeit',
  annahmen: ['Volumenstrom bleibt während des Vorgangs konstant (z. B. unabhängig vom Füllstand)'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik' },
  warnungen: (bekannt, ziel) => {
    const warnungen: string[] = []
    if (ziel !== 'V' && bekannt.V < 0) warnungen.push('Negatives Volumen ist nicht sinnvoll.')
    return warnungen
  },
  beispiel: {
    // V = 5 m³, V̇ = 0,01 m³/s -> t = 500 s
    bekannt: { V: 5, V_dot: 0.01 },
    ziel: 't',
    erwartet: { t: 500 },
    toleranzRelativ: 1e-9,
  },
}
