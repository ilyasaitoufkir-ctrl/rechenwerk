import type { Formula } from '../../types/formula'

export const co2Emissionen: Formula = {
  id: 'co2-emissionen',
  name: 'CO₂-Emissionen',
  kategorie: 'Energie & Kosten',
  stichworte: ['co2', 'emissionen', 'klimabilanz', 'emissionsfaktor'],
  latex: 'm_{CO_2} = E \\cdot f_{CO_2}',
  variablen: [
    { id: 'E', symbol: 'E', name: 'Energiemenge', dimension: 'energy', defaultUnit: 'kWh' },
    {
      id: 'f',
      symbol: 'f_{CO_2}',
      name: 'Emissionsfaktor',
      dimension: 'emissionFactor',
      defaultUnit: 'kgkWh',
      hinweis: 'Richtwerte z. B. Erdgas ≈ 0,201 kg/kWh (Hi), Heizöl EL ≈ 0,266 kg/kWh (Hi), Strommix DE ≈ 0,38 kg/kWh - Bezug (Heizwert/Strommix) beachten, Werte ändern sich jährlich',
    },
    { id: 'm', symbol: 'm_{CO_2}', name: 'CO₂-Masse', dimension: 'mass', defaultUnit: 't' },
  ],
  zielgroessen: ['m'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'm') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    const energieKwh = bekannt.E / 3.6e6 // J -> kWh
    const massKg = energieKwh * bekannt.f // f ist SI in kg CO2/kWh
    return { m: massKg } // SI der Dimension 'mass' ist kg - Anzeige in t übernimmt die Einheitenwahl
  },
  gueltigkeit: 'Grobe Emissionsbilanzierung über einen pauschalen Emissionsfaktor, keine detaillierte Ökobilanz',
  annahmen: [
    'Emissionsfaktor und Energiemenge beziehen sich auf denselben Bezug (Heizwert/Brennwert bzw. Strommix)',
    'Vorkette (Förderung, Transport) nur so weit berücksichtigt, wie im Emissionsfaktor enthalten',
  ],
  quelle: { werk: 'Umweltbundesamt (UBA), Richtwerte - jährlich aktualisiert', unsicher: true },
  richtwert: true,
  beispiel: {
    // E=50000 kWh=1,8e11 J, f=0,201 kg/kWh (Erdgas) -> m=50000*0,201=10050 kg
    bekannt: { E: 1.8e11, f: 0.201 },
    ziel: 'm',
    erwartet: { m: 10050 },
    toleranzRelativ: 1e-6,
  },
}
