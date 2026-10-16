import type { Formula } from '../../types/formula'
import { G } from '../../units'

export const npsh: Formula = {
  id: 'npsh',
  name: 'NPSH-Prüfung',
  kategorie: 'Pumpen',
  stichworte: ['npsh', 'kavitation', 'saughöhe', 'zulaufhöhe', 'dampfdruck'],
  latex: 'NPSH_A = \\dfrac{p_{0,abs} - p_D}{\\rho \\, g} + z_0 - H_{V,Saug}',
  variablen: [
    { id: 'p0abs', symbol: 'p_{0,abs}', name: 'Absolutdruck am Flüssigkeitsspiegel', dimension: 'pressure', defaultUnit: 'bar' },
    {
      id: 'pD',
      symbol: 'p_D',
      name: 'Dampfdruck der Flüssigkeit',
      dimension: 'pressure',
      defaultUnit: 'bar',
      hinweis: 'Für Wasser: aus "Sattdampftafel" (Kategorie Dampf) bei der Betriebstemperatur per Ergebnis übernehmen; für andere Flüssigkeiten direkt eingeben',
    },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    {
      id: 'z0',
      symbol: 'z_0',
      name: 'Höhe Flüssigkeitsspiegel über Pumpe',
      dimension: 'length',
      defaultUnit: 'm',
      hinweis: 'Positiv bei Zulauf (Spiegel über Pumpe), negativ bei Saugbetrieb (Spiegel unter Pumpe)',
    },
    { id: 'HVSaug', symbol: 'H_{V,Saug}', name: 'Verlusthöhe Saugleitung', dimension: 'length', defaultUnit: 'm', hinweis: 'Aus "Druckverlust nach Darcy-Weisbach" (Druckhöhe h) per Ergebnis übernehmen' },
    { id: 'npshR', symbol: 'NPSH_R', name: 'Erforderlicher NPSH (Datenblatt)', dimension: 'length', defaultUnit: 'm' },
    {
      id: 'zuschlag',
      symbol: '\\Delta NPSH',
      name: 'Sicherheitszuschlag',
      dimension: 'length',
      defaultUnit: 'm',
      hinweis: 'Richtwert: 0,5-1 m bzw. ca. 10% von NPSH_R',
    },
    { id: 'NPSHA', symbol: 'NPSH_A', name: 'Verfügbarer NPSH', dimension: 'length', defaultUnit: 'm' },
  ],
  zielgroessen: ['NPSHA'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'NPSHA') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    if (bekannt.rho <= 0) throw new Error('Dichte muss größer 0 sein')
    const NPSHA = (bekannt.p0abs - bekannt.pD) / (bekannt.rho * G) + bekannt.z0 - bekannt.HVSaug
    // npshR/zuschlag als Durchreiche mitgeben, damit warnungen()/empfehlung() (die nur das
    // compute()-Ergebnis sehen) den Vergleich NPSH_A gegen NPSH_R + Zuschlag bilden können
    return { NPSHA, npshR: bekannt.npshR, zuschlag: bekannt.zuschlag }
  },
  gueltigkeit: 'Stationärer Betrieb, Saugleitung vollständig mit Flüssigkeit gefüllt',
  annahmen: ['Keine weiteren Verluste außer der angegebenen Saugleitungs-Verlusthöhe berücksichtigt'],
  quelle: { werk: 'Dubbel, Taschenbuch für den Maschinenbau; Sigloch, Technische Fluidmechanik' },
  empfehlung: (ergebnis) => {
    const marge = ergebnis.NPSHA - ergebnis.npshR - ergebnis.zuschlag
    if (ergebnis.NPSHA >= ergebnis.npshR && marge >= 0) {
      return `NPSH ausreichend - Marge von ${marge.toFixed(2)} m über NPSH_R + Sicherheitszuschlag.`
    }
    return undefined
  },
  warnungen: (bekannt, _ziel, ergebnis) => {
    const warnungen: string[] = []
    const marge = ergebnis.NPSHA - bekannt.npshR - bekannt.zuschlag
    if (ergebnis.NPSHA < bekannt.npshR) {
      warnungen.push(
        `Kavitationsgefahr: NPSH_A (${ergebnis.NPSHA.toFixed(2)} m) ist kleiner als NPSH_R (${bekannt.npshR.toFixed(2)} m).`,
      )
    } else if (marge < 0) {
      warnungen.push(
        `NPSH knapp: Der Sicherheitszuschlag von ${bekannt.zuschlag.toFixed(2)} m wird nicht erreicht (Marge ${marge.toFixed(2)} m).`,
      )
    }
    return warnungen
  },
  beispiel: {
    // p0abs=1,01325 bar, pD=2339 Pa (Wasser 20°C), ρ=998, z0=2m, HVSaug=0,5m, NPSHR=3m, Zuschlag=0,5m
    // NPSHA = (101325-2339)/(998*9,80665) + 2 - 0,5 = 11,613991 m
    bekannt: { p0abs: 101325, pD: 2339, rho: 998, z0: 2, HVSaug: 0.5, npshR: 3, zuschlag: 0.5 },
    ziel: 'NPSHA',
    erwartet: { NPSHA: 11.613991 },
    toleranzRelativ: 1e-4,
  },
}
