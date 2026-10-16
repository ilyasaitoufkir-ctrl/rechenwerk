import type { Formula } from '../../types/formula'

export const waermeverlustRohrDaemmung: Formula = {
  id: 'waermeverlust-rohr-daemmung',
  name: 'Wärmeverlust Rohr mit Dämmung',
  kategorie: 'Wärmeübertragung',
  stichworte: ['rohr', 'dämmung', 'isolierung', 'wärmeverlust', 'einsparung', 'zylindrisch'],
  latex:
    '\\dfrac{\\dot{Q}}{L} = \\dfrac{2\\pi (T_i - T_u)}{\\dfrac{\\ln(r_2/r_1)}{\\lambda_{Rohr}} + \\dfrac{\\ln(r_3/r_2)}{\\lambda_{Dämm}} + \\dfrac{1}{\\alpha_a \\, r_3}}',
  variablen: [
    { id: 'r1', symbol: 'r_1', name: 'Rohrinnenradius', dimension: 'length', defaultUnit: 'mm' },
    { id: 'r2', symbol: 'r_2', name: 'Rohraußenradius', dimension: 'length', defaultUnit: 'mm' },
    { id: 'r3', symbol: 'r_3', name: 'Außenradius Dämmung', dimension: 'length', defaultUnit: 'mm' },
    { id: 'lambdaRohr', symbol: '\\lambda_{Rohr}', name: 'Wärmeleitfähigkeit Rohr', dimension: 'thermalConductivity', defaultUnit: 'WmK' },
    { id: 'lambdaDaemm', symbol: '\\lambda_{Dämm}', name: 'Wärmeleitfähigkeit Dämmung', dimension: 'thermalConductivity', defaultUnit: 'WmK' },
    { id: 'Ti', symbol: 'T_i', name: 'Medientemperatur', dimension: 'temperature', defaultUnit: 'C' },
    { id: 'Tu', symbol: 'T_u', name: 'Umgebungstemperatur', dimension: 'temperature', defaultUnit: 'C' },
    {
      id: 'alphaA',
      symbol: '\\alpha_a',
      name: 'Äußerer Wärmeübergang, gedämmt',
      dimension: 'heatTransferCoefficient',
      defaultUnit: 'Wm2K',
      hinweis: 'Richtwert freie Konvektion an gedämmter Oberfläche: ca. 8-10 W/(m²·K)',
    },
    {
      id: 'alphaABlank',
      symbol: '\\alpha_{a,blank}',
      name: 'Äußerer Wärmeübergang, ungedämmt',
      dimension: 'heatTransferCoefficient',
      defaultUnit: 'Wm2K',
      hinweis: 'Richtwert freie Konvektion an heißer blanker Rohroberfläche: ca. 12-20 W/(m²·K)',
    },
    { id: 'Lrohr', symbol: 'L', name: 'Rohrleitungslänge', dimension: 'length', defaultUnit: 'm' },
    { id: 'betriebsstunden', symbol: 't_B', name: 'Betriebsstunden pro Jahr', dimension: 'time', defaultUnit: 'h' },
    {
      id: 'waermepreis',
      symbol: 'p_W',
      name: 'Wärmepreis je kWh',
      dimension: 'currency',
      defaultUnit: 'EUR',
    },
    { id: 'Qdot_L_gedaemmt', symbol: '\\dot{Q}/L_{ged}', name: 'Wärmeverlust gedämmt', dimension: 'heatFlowPerLength', defaultUnit: 'Wm' },
    { id: 'Qdot_L_ungedaemmt', symbol: '\\dot{Q}/L_{unged}', name: 'Wärmeverlust ungedämmt', dimension: 'heatFlowPerLength', defaultUnit: 'Wm' },
    { id: 'einsparungWm', symbol: '\\Delta \\dot{Q}/L', name: 'Einsparung je Meter', dimension: 'heatFlowPerLength', defaultUnit: 'Wm' },
    { id: 'einsparungKwhJahr', symbol: 'E_a', name: 'Einsparung pro Jahr', dimension: 'energy', defaultUnit: 'kWh' },
    { id: 'einsparungEuroJahr', symbol: 'K_a', name: 'Kosteneinsparung pro Jahr', dimension: 'currency', defaultUnit: 'EUR' },
  ],
  zielgroessen: ['Qdot_L_gedaemmt'],
  zusatzAusgaben: ['Qdot_L_ungedaemmt', 'einsparungWm', 'einsparungKwhJahr', 'einsparungEuroJahr'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'Qdot_L_gedaemmt') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const { r1, r2, r3, lambdaRohr, lambdaDaemm, Ti, Tu, alphaA, alphaABlank, Lrohr, betriebsstunden, waermepreis } =
      bekannt
    if (r1 <= 0 || r2 <= r1 || r3 <= r2) {
      throw new Error('Radien müssen r_1 < r_2 < r_3 erfüllen (positive Wand- und Dämmdicke)')
    }
    const dT = Ti - Tu
    const widerstandGedaemmt =
      Math.log(r2 / r1) / lambdaRohr + Math.log(r3 / r2) / lambdaDaemm + 1 / (alphaA * r3)
    const widerstandUngedaemmt = Math.log(r2 / r1) / lambdaRohr + 1 / (alphaABlank * r2)
    const QdotLGedaemmt = (2 * Math.PI * dT) / widerstandGedaemmt
    const QdotLUngedaemmt = (2 * Math.PI * dT) / widerstandUngedaemmt
    const einsparungWm = QdotLUngedaemmt - QdotLGedaemmt
    // Energie = Leistung * Zeit; betriebsstunden ist bereits SI (Sekunden) -> Ergebnis in Joule (SI der Dimension 'energy')
    const einsparungJJahr = einsparungWm * Lrohr * betriebsstunden
    const einsparungEuroJahr = (einsparungJJahr / 3.6e6) * waermepreis // J -> kWh für den Preisbezug
    return {
      Qdot_L_gedaemmt: QdotLGedaemmt,
      Qdot_L_ungedaemmt: QdotLUngedaemmt,
      einsparungWm,
      einsparungKwhJahr: einsparungJJahr,
      einsparungEuroJahr,
    }
  },
  gueltigkeit: 'Zylindrische Mehrschichtwand (Rohr + eine Dämmschicht), stationärer Zustand, radialsymmetrisch',
  annahmen: [
    'Stationärer Zustand',
    'Wärmeleitfähigkeiten konstant',
    'Innerer Wärmeübergang (Medium an Rohrinnenwand) vernachlässigt bzw. in T_i bereits als Wandtemperatur enthalten',
    'Äußere Wärmeübergangskoeffizienten als Richtwerte angenommen (freie Konvektion)',
  ],
  quelle: { werk: 'VDI 2055; VDI Wärmeatlas', unsicher: true },
  richtwert: true,
  warnungen: (bekannt) => {
    const warnungen: string[] = []
    if (bekannt.Ti <= bekannt.Tu) {
      warnungen.push('Medientemperatur ist nicht größer als Umgebungstemperatur - Ergebnis prüfen.')
    }
    return warnungen
  },
  beispiel: {
    // r1=0,05m, r2=0,06m, r3=0,09m, λRohr=50, λDämm=0,04, Ti=423,15K, Tu=293,15K,
    // αa=10, αa,blank=15, L=50m, tB=8000h=28800000s, Preis=0,08 €/kWh
    bekannt: {
      r1: 0.05,
      r2: 0.06,
      r3: 0.09,
      lambdaRohr: 50,
      lambdaDaemm: 0.04,
      Ti: 423.15,
      Tu: 293.15,
      alphaA: 10,
      alphaABlank: 15,
      Lrohr: 50,
      betriebsstunden: 28800000,
      waermepreis: 0.08,
    },
    ziel: 'Qdot_L_gedaemmt',
    erwartet: {
      Qdot_L_gedaemmt: 72.59675783,
      Qdot_L_ungedaemmt: 732.7280229,
      einsparungWm: 660.1312651,
      einsparungKwhJahr: 950589021680.8, // Joule (SI) = 264052,506 kWh
      einsparungEuroJahr: 21124.2,
    },
    toleranzRelativ: 1e-4,
  },
}
