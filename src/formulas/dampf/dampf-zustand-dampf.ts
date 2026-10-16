import type { Formula } from '../../types/formula'
import { region2 } from '../../lib/iapws-if97'

export const dampfZustandDampf: Formula = {
  id: 'dampf-zustand-dampf',
  name: 'Wasserdampf, Zustand (Region 2)',
  kategorie: 'Dampf (IAPWS-IF97)',
  stichworte: ['dampf', 'zustand', 'enthalpie', 'entropie', 'iapws', 'if97', 'überhitzt'],
  latex: 'h, s, v, u, c_p = f(T, p) \\quad \\text{(Region 2, Dampf)}',
  variablen: [
    { id: 'T', symbol: 'T', name: 'Temperatur', dimension: 'temperature', defaultUnit: 'C' },
    { id: 'p', symbol: 'p', name: 'Druck', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'h', symbol: 'h', name: 'Spezifische Enthalpie', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'v', symbol: 'v', name: 'Spezifisches Volumen', dimension: 'specificVolume', defaultUnit: 'm3kg' },
    { id: 's', symbol: 's', name: 'Spezifische Entropie', dimension: 'specificHeatCapacity', defaultUnit: 'kJkgK' },
    { id: 'u', symbol: 'u', name: 'Spezifische innere Energie', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'cp', symbol: 'c_p', name: 'Spez. isobare Wärmekapazität', dimension: 'specificHeatCapacity', defaultUnit: 'kJkgK' },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
  ],
  zielgroessen: ['h'],
  zusatzAusgaben: ['v', 's', 'u', 'cp', 'rho'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'h') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const z = region2(bekannt.T, bekannt.p / 1e6)
    return { h: z.h, v: z.v, s: z.s, u: z.u, cp: z.cp, rho: z.rho }
  },
  gueltigkeit:
    'IAPWS-IF97 Region 2 (Dampf): bei T ≤ 350 °C unterhalb der Sättigungslinie, bei höherer Temperatur bis 800 °C unterhalb der Region-2/3-Grenzkurve (max. 100 MPa). Lehnt Eingaben außerhalb klar ab, extrapoliert nie.',
  annahmen: ['Reinstoff Wasser', 'Thermodynamisches Gleichgewicht'],
  quelle: {
    werk: 'IAPWS, Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam (2007)',
    kapitel: 'Region 2, Gl. 15-17',
  },
  beispiel: {
    // Offizieller IAPWS-Verifikationspunkt: T=300K, p=0,0035MPa -> h=2549,91145 kJ/kg
    bekannt: { T: 300, p: 3500 },
    ziel: 'h',
    erwartet: { h: 2549911.45 },
    toleranzRelativ: 1e-6,
  },
}
