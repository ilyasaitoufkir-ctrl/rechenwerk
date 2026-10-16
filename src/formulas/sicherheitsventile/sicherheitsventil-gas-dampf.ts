import type { Formula } from '../../types/formula'
import { ausstroemung } from '../../lib/ausstroemung'

export const sicherheitsventilGasDampf: Formula = {
  id: 'sicherheitsventil-gas-dampf',
  name: 'Sicherheitsventil, Gase und Dämpfe',
  kategorie: 'Sicherheitsventile',
  stichworte: ['sicherheitsventil', 'abblasen', 'ausflussziffer', 'gase', 'dämpfe', 'überdruck'],
  latex:
    '\\dot{m} = \\alpha_w \\cdot A \\cdot \\sqrt{\\kappa \\, p_0 \\, \\rho_0 \\left(\\dfrac{2}{\\kappa+1}\\right)^{\\frac{\\kappa+1}{\\kappa-1}}} \\quad \\text{(kritisch)}',
  variablen: [
    {
      id: 'alphaw',
      symbol: '\\alpha_w',
      name: 'Ausflussziffer',
      dimension: 'dimensionless',
      defaultUnit: '_',
      min: 0,
      max: 1,
      hinweis: 'Zuerkannter Wert des Ventilherstellers (Bauteilprüfung), kein Richtwert',
    },
    { id: 'p0', symbol: 'p_0', name: 'Ansprechdruck (absolut, vor dem Ventil)', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'p2', symbol: 'p_2', name: 'Gegendruck (absolut, hinter dem Ventil)', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'kappa', symbol: '\\kappa', name: 'Isentropenexponent', dimension: 'dimensionless', defaultUnit: '_', min: 1 },
    {
      id: 'rho0',
      symbol: '\\rho_0',
      name: 'Dichte vor dem Ventil',
      dimension: 'density',
      defaultUnit: 'kgm3',
      hinweis: 'Für Wasserdampf: aus "Sattdampftafel" oder "Wasserdampf, Zustand" (Dampf-Kategorie) per Ergebnis übernehmen',
    },
    { id: 'A', symbol: 'A', name: 'Engster Strömungsquerschnitt', dimension: 'area', defaultUnit: 'mm2' },
    { id: 'mdot', symbol: '\\dot{m}', name: 'Abzuführender Massenstrom', dimension: 'massFlow', defaultUnit: 'kgh' },
  ],
  zielgroessen: ['mdot', 'A'],
  compute: (bekannt, ziel): Record<string, number> => {
    const { massenstrom: spezifisch, schallnah } = ausstroemung(1, 1, bekannt.kappa, bekannt.p0, bekannt.rho0, bekannt.p2)
    if (ziel === 'mdot') {
      return { mdot: bekannt.alphaw * bekannt.A * spezifisch, schallnah: schallnah ? 1 : 0 }
    }
    if (ziel === 'A') {
      if (bekannt.alphaw <= 0) throw new Error('Ausflussziffer muss größer 0 sein')
      return { A: bekannt.mdot / (bekannt.alphaw * spezifisch), schallnah: schallnah ? 1 : 0 }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Isentrope Düsenströmung eines idealen Gases, kritisch (schallnah) oder unterkritisch je nach Druckverhältnis p2/p0',
  annahmen: [
    'Physikalisch aus der isentropen Düsenströmung hergeleitete SI-Form - keine normspezifischen Korrekturfaktoren (z. B. Kdr, Kb für Gegendruck/Faltenbalg nach ISO 4126-1) enthalten',
    'Ideales Gasverhalten',
    'α_w ist ein vom Hersteller zuerkannter Wert, keine Tabelle hinterlegt',
  ],
  quelle: { werk: 'DIN EN ISO 4126-1; physikalisch hergeleitete Form, keine normspezifische Zahlenwertgleichung', unsicher: true },
  richtwert: true,
  warnungen: (_bekannt, _ziel, ergebnis) => {
    const warnungen: string[] = []
    if (ergebnis.schallnah === 0) {
      warnungen.push('Unterkritische (nicht schallnahe) Ausströmung - Gegendruck liegt über dem kritischen Druckverhältnis.')
    }
    return warnungen
  },
  beispiel: {
    // αw=0,65, p0=1e6 Pa, p2=1e5 Pa (weit unterkritisch -> kritisch), κ=1,4, ρ0=10 kg/m³, A=1e-4 m²
    bekannt: { alphaw: 0.65, p0: 1e6, p2: 1e5, kappa: 1.4, rho0: 10, A: 1e-4 },
    ziel: 'mdot',
    erwartet: { mdot: 0.1407452142 },
    toleranzRelativ: 1e-6,
  },
}
