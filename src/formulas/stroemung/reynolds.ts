import type { Formula } from '../../types/formula'
import { regime } from '../../lib/colebrook'

export const reynolds: Formula = {
  id: 'reynolds',
  name: 'Reynoldszahl',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['reynolds', 're', 'laminar', 'turbulent', 'strömungsform'],
  latex: 'Re = \\dfrac{v \\, d}{\\nu} = \\dfrac{\\rho \\, v \\, d}{\\eta}',
  variablen: [
    { id: 'v', symbol: 'v', name: 'Strömungsgeschwindigkeit', dimension: 'velocity', defaultUnit: 'ms' },
    { id: 'd', symbol: 'd', name: 'Innendurchmesser', dimension: 'length', defaultUnit: 'mm' },
    {
      id: 'nu',
      symbol: '\\nu',
      name: 'Kinematische Viskosität',
      dimension: 'kinematicViscosity',
      defaultUnit: 'mm2s',
      hinweis: 'Falls nur dynamische Viskosität und Dichte bekannt sind: ν = η / ρ (siehe Einheitenumrechner)',
    },
    { id: 'Re', symbol: 'Re', name: 'Reynoldszahl', dimension: 'dimensionless', defaultUnit: '_' },
  ],
  zielgroessen: ['Re'],
  compute: (bekannt, ziel) => {
    if (ziel !== 'Re') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.nu <= 0) throw new Error('Kinematische Viskosität muss größer 0 sein')
    return { Re: (bekannt.v * bekannt.d) / bekannt.nu }
  },
  gueltigkeit: 'Durchströmtes kreisrundes Rohr, d = charakteristische Länge',
  annahmen: ['Newtonsches Fluid', 'Vollständig ausgebildetes Strömungsprofil'],
  quelle: { werk: 'Sigloch, Technische Fluidmechanik', kapitel: 'Reynoldszahl' },
  warnungen: (_bekannt, _ziel, ergebnis) => {
    const r = regime(ergebnis.Re)
    if (r === 'laminar') return ['Laminare Strömung (Re < 2300).']
    if (r === 'uebergang') {
      return [
        'Übergangsbereich (2300 ≤ Re < 4000): Strömungsform nicht eindeutig, Grenzen sind Richtwerte.',
      ]
    }
    return ['Turbulente Strömung (Re ≥ 4000).']
  },
  beispiel: {
    // Wasser 20 °C: v = 1 m/s, d = 0,05 m, ν ≈ 1,0038e-6 m²/s
    // Re = 1 * 0,05 / 1,0038e-6 = 49810,72 (turbulent)
    bekannt: { v: 1, d: 0.05, nu: 1.0038e-6 },
    ziel: 'Re',
    erwartet: { Re: 49810.719 },
    toleranzRelativ: 1e-4,
  },
}
