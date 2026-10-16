import type { Formula } from '../../types/formula'
import { kritischeAusstroemung } from '../../lib/ausstroemung'

export const dampfverlustLeckage: Formula = {
  id: 'dampfverlust-leckage',
  name: 'Dampfverlust durch Leckage',
  kategorie: 'Dampf (IAPWS-IF97)',
  stichworte: ['leckage', 'dampfverlust', 'ausströmung', 'leck', 'öffnung'],
  latex:
    '\\dot{m} = C_d \\cdot A \\cdot \\sqrt{\\kappa \\, p_0 \\, \\rho_0 \\left(\\dfrac{2}{\\kappa+1}\\right)^{\\frac{\\kappa+1}{\\kappa-1}}}',
  variablen: [
    { id: 'cd', symbol: 'C_d', name: 'Durchflusskoeffizient', dimension: 'dimensionless', defaultUnit: '_', min: 0, max: 1, hinweis: 'Richtwert für scharfkantige Öffnungen: C_d ≈ 0,6-0,8' },
    { id: 'A', symbol: 'A', name: 'Leckquerschnitt', dimension: 'area', defaultUnit: 'mm2' },
    { id: 'kappa', symbol: '\\kappa', name: 'Isentropenexponent', dimension: 'dimensionless', defaultUnit: '_', hinweis: 'Richtwert Wasserdampf: κ ≈ 1,33' },
    { id: 'p0', symbol: 'p_0', name: 'Druck vor der Öffnung', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'rho0', symbol: '\\rho_0', name: 'Dichte vor der Öffnung', dimension: 'density', defaultUnit: 'kgm3', hinweis: 'Aus "Sattdampftafel" oder "Wasserdampf, Zustand" per Ergebnis übernehmen (ρ = 1/v)' },
    { id: 'mdot', symbol: '\\dot{m}', name: 'Leckagemassenstrom', dimension: 'massFlow', defaultUnit: 'kgh' },
  ],
  zielgroessen: ['mdot'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'mdot') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { mdot: kritischeAusstroemung(bekannt.cd, bekannt.A, bekannt.kappa, bekannt.p0, bekannt.rho0) }
  },
  gueltigkeit: 'Kritische (schallnahe) Ausströmung - gilt, wenn der Gegendruck unter dem kritischen Druckverhältnis liegt (bei Ausströmung ins Freie praktisch immer erfüllt)',
  annahmen: ['Ideales Gas', 'Adiabate, reibungsfreie Düsenströmung bis auf den Durchflusskoeffizienten C_d'],
  quelle: { werk: 'Bohl/Elmendorf, Technische Strömungslehre', unsicher: true },
  richtwert: true,
  warnungen: () => ['Ergebnis ist eine Abschätzung der Größenordnung, keine Auslegungsrechnung.'],
  beispiel: {
    // Cd=0,65, A=2mm²=2e-6 m², κ=1,33, p0=6 bar=600000 Pa, ρ0=3,17 kg/m³ (Sattdampf ca. 6 bar)
    bekannt: { cd: 0.65, A: 2e-6, kappa: 1.33, p0: 600000, rho0: 3.17 },
    ziel: 'mdot',
    erwartet: { mdot: 0.001205935 },
    toleranzRelativ: 1e-5,
  },
}
