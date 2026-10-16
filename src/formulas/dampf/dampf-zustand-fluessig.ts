import type { Formula } from '../../types/formula'
import { region1 } from '../../lib/iapws-if97'

export const dampfZustandFluessig: Formula = {
  id: 'dampf-zustand-fluessig',
  name: 'Wasser, Zustand (Region 1)',
  kategorie: 'Dampf (IAPWS-IF97)',
  stichworte: ['wasser', 'zustand', 'enthalpie', 'entropie', 'iapws', 'if97', 'flüssig'],
  latex: 'h, s, v, u, c_p = f(T, p) \\quad \\text{(Region 1, Flüssigkeit)}',
  variablen: [
    { id: 'T', symbol: 'T', name: 'Temperatur', dimension: 'temperature', defaultUnit: 'C' },
    { id: 'p', symbol: 'p', name: 'Druck', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'h', symbol: 'h', name: 'Spezifische Enthalpie', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'v', symbol: 'v', name: 'Spezifisches Volumen', dimension: 'specificVolume', defaultUnit: 'lkg' },
    { id: 's', symbol: 's', name: 'Spezifische Entropie', dimension: 'specificHeatCapacity', defaultUnit: 'kJkgK' },
    { id: 'u', symbol: 'u', name: 'Spezifische innere Energie', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'cp', symbol: 'c_p', name: 'Spez. isobare Wärmekapazität', dimension: 'specificHeatCapacity', defaultUnit: 'kJkgK' },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
  ],
  zielgroessen: ['h'],
  zusatzAusgaben: ['v', 's', 'u', 'cp', 'rho'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'h') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const z = region1(bekannt.T, bekannt.p / 1e6)
    return { h: z.h, v: z.v, s: z.s, u: z.u, cp: z.cp, rho: z.rho }
  },
  gueltigkeit:
    'IAPWS-IF97 Region 1 (kompressible Flüssigkeit): 0-350 °C, Druck zwischen Sättigungsdruck p_s(T) und 100 MPa. Lehnt Eingaben außerhalb klar ab, extrapoliert nie.',
  annahmen: ['Reinstoff Wasser', 'Thermodynamisches Gleichgewicht'],
  quelle: {
    werk: 'IAPWS, Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam (2007)',
    kapitel: 'Region 1, Gl. 7',
  },
  beispiel: {
    // Offizieller IAPWS-Verifikationspunkt: T=300K=26,85°C, p=3MPa -> h=115,331273 kJ/kg
    bekannt: { T: 300, p: 3e6 },
    ziel: 'h',
    erwartet: { h: 115331.273, v: 0.00100215168 },
    toleranzRelativ: 1e-6,
  },
}
