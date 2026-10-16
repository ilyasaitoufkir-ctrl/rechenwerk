import type { Formula } from '../../types/formula'
import { saettigung } from '../../lib/iapws-if97'

export const dampfSaettigung: Formula = {
  id: 'dampf-saettigung',
  name: 'Sattdampftafel',
  kategorie: 'Dampf (IAPWS-IF97)',
  stichworte: ['sattdampf', 'sättigung', 'siedetemperatur', 'verdampfungsenthalpie', 'iapws', 'if97'],
  latex: 'p_s(T) \\quad \\text{bzw.} \\quad T_s(p)',
  variablen: [
    { id: 'T', symbol: 'T', name: 'Sättigungstemperatur', dimension: 'temperature', defaultUnit: 'C' },
    { id: 'p', symbol: 'p', name: 'Sättigungsdruck', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'hFluessig', symbol: "h'", name: 'Enthalpie Siedewasser', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'hDampf', symbol: "h''", name: 'Enthalpie Sattdampf', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'r', symbol: 'r', name: 'Verdampfungsenthalpie', dimension: 'specificEnthalpy', defaultUnit: 'kJkg' },
    { id: 'vDampf', symbol: "v''", name: 'Spez. Volumen Sattdampf', dimension: 'specificVolume', defaultUnit: 'm3kg' },
    { id: 'rhoDampf', symbol: "\\rho''", name: 'Dichte Sattdampf', dimension: 'density', defaultUnit: 'kgm3' },
  ],
  zielgroessen: ['p', 'T'],
  zusatzAusgaben: ['hFluessig', 'hDampf', 'r', 'vDampf', 'rhoDampf'],
  compute: (bekannt, ziel): Record<string, number> => {
    const s =
      ziel === 'p'
        ? saettigung({ T: bekannt.T })
        : ziel === 'T'
          ? saettigung({ pMPa: bekannt.p / 1e6 })
          : (() => {
              throw new Error(`Unbekannte Zielgröße "${ziel}"`)
            })()
    return {
      p: s.pMPa * 1e6,
      T: s.T,
      hFluessig: s.fluessig.h,
      hDampf: s.dampf.h,
      r: s.r,
      vDampf: s.dampf.v,
      rhoDampf: s.dampf.rho,
    }
  },
  gueltigkeit:
    'Sättigungslinie zwischen 0,01 °C und 350 °C (Region-1/2/3-Grenze) - für höhere Temperaturen bis zum kritischen Punkt (373,95 °C) wäre Region 3 nötig, die hier nicht implementiert ist.',
  annahmen: ['Reinstoff Wasser, Gleichgewicht zwischen Flüssigkeit und Dampf'],
  quelle: {
    werk: 'IAPWS, Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam (2007)',
    kapitel: 'Region 4, Gl. 30',
  },
  beispiel: {
    // Plausibilitätscheck: 1,01325 bar -> T_s ≈ 99,97 °C = 373,124 K, r ≈ 2257 kJ/kg
    bekannt: { p: 101325 },
    ziel: 'T',
    erwartet: { T: 373.1243, r: 2256540.7 },
    toleranzRelativ: 1e-4,
  },
}
