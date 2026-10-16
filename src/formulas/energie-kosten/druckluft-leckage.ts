import type { Formula } from '../../types/formula'
import { kritischeAusstroemung } from '../../lib/ausstroemung'

const R_LUFT = 287 // J/(kg·K), spezifische Gaskonstante trockener Luft
const KAPPA_LUFT = 1.4

export const druckluftLeckage: Formula = {
  id: 'druckluft-leckage',
  name: 'Druckluftleckage',
  kategorie: 'Energie & Kosten',
  stichworte: ['druckluft', 'leckage', 'leck', 'kompressor', 'mehrleistung'],
  latex:
    '\\dot{m} = C_d \\cdot \\dfrac{\\pi d^2}{4} \\cdot \\sqrt{\\kappa \\, p_0 \\, \\rho_0 \\left(\\dfrac{2}{\\kappa+1}\\right)^{\\frac{\\kappa+1}{\\kappa-1}}}',
  variablen: [
    { id: 'd', symbol: 'd', name: 'Lochdurchmesser', dimension: 'length', defaultUnit: 'mm' },
    { id: 'p0', symbol: 'p_0', name: 'Netzdruck (absolut)', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'T0', symbol: 'T_0', name: 'Lufttemperatur im Netz', dimension: 'temperature', defaultUnit: 'C' },
    { id: 'cd', symbol: 'C_d', name: 'Durchflusskoeffizient', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1, hinweis: 'Richtwert für ein rundes Loch: C_d ≈ 0,6-0,8' },
    {
      id: 'rhoAnsaug',
      symbol: '\\rho_{an}',
      name: 'Luftdichte am Kompressoransaug',
      dimension: 'density',
      defaultUnit: 'kgm3',
      hinweis: 'Richtwert bei Normalbedingungen ca. 1,2 kg/m³',
    },
    {
      id: 'spezLeistung',
      symbol: 'p_{spez}',
      name: 'Spez. Kompressorleistung',
      dimension: 'compressorSpecificPower',
      defaultUnit: 'kWm3min',
      hinweis: 'Richtwert Schraubenkompressor: ca. 0,10-0,13 kW je m³/min Ansaugvolumenstrom',
    },
    { id: 'betriebsstunden', symbol: 't_B', name: 'Betriebsstunden pro Jahr', dimension: 'time', defaultUnit: 'h' },
    { id: 'strompreis', symbol: 'p_{el}', name: 'Strompreis je kWh', dimension: 'currency', defaultUnit: 'EUR' },
    { id: 'mdot', symbol: '\\dot{m}', name: 'Leckagemassenstrom', dimension: 'massFlow', defaultUnit: 'kgh' },
    { id: 'mehrleistung', symbol: 'P_{Mehr}', name: 'Kompressor-Mehrleistung', dimension: 'power', defaultUnit: 'kW' },
    { id: 'kostenProJahr', symbol: 'K_a', name: 'Kosten pro Jahr', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['mdot'],
  zusatzAusgaben: ['mehrleistung', 'kostenProJahr'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'mdot') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const { d, p0, T0, cd, rhoAnsaug, spezLeistung, betriebsstunden, strompreis } = bekannt
    if (d <= 0) throw new Error('Lochdurchmesser muss größer 0 sein')
    const A = (Math.PI * d * d) / 4
    const rho0 = p0 / (R_LUFT * T0)
    const mdot = kritischeAusstroemung(cd, A, KAPPA_LUFT, p0, rho0)
    const vAnsaugM3s = mdot / rhoAnsaug
    const mehrleistung = vAnsaugM3s * spezLeistung // W, da spezLeistung SI in W/(m³/s)
    const betriebsstundenH = betriebsstunden / 3600
    const kostenProJahr = (mehrleistung / 1000) * betriebsstundenH * strompreis
    return { mdot, mehrleistung, kostenProJahr }
  },
  gueltigkeit: 'Kritische (schallnahe) Ausströmung ins Freie, Luft als ideales Gas',
  annahmen: [
    'Loch scharfkantig und rund',
    'Spezifische Kompressorleistung über den Betriebspunkt konstant',
    'Keine Leerlaufabschaltung des Kompressors während der Leckage',
  ],
  quelle: { werk: 'Bohl/Elmendorf, Technische Strömungslehre', unsicher: true },
  richtwert: true,
  warnungen: () => ['Ergebnis ist eine Abschätzung der Größenordnung, keine Auslegungsrechnung.'],
  beispiel: {
    // d=2mm, p0=700000 Pa, T0=293,15K, Cd=0,62, ρan=1,2 kg/m³, spezL=0,11 kW/(m³/min)=6600 W/(m³/s)
    // tB=8760h=31536000s, Strompreis=0,20 €/kWh
    bekannt: {
      d: 0.002,
      p0: 700000,
      T0: 293.15,
      cd: 0.62,
      rhoAnsaug: 1.2,
      spezLeistung: 6600,
      betriebsstunden: 31536000,
      strompreis: 0.2,
    },
    ziel: 'mdot',
    erwartet: { mdot: 0.003218651710, mehrleistung: 17.70258441, kostenProJahr: 31.01492788 },
    toleranzRelativ: 1e-4,
  },
}
