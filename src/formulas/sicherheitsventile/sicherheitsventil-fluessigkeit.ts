import type { Formula } from '../../types/formula'

export const sicherheitsventilFluessigkeit: Formula = {
  id: 'sicherheitsventil-fluessigkeit',
  name: 'Sicherheitsventil, Flüssigkeiten',
  kategorie: 'Sicherheitsventile',
  stichworte: ['sicherheitsventil', 'abblasen', 'ausflussziffer', 'flüssigkeiten', 'überdruck'],
  latex: '\\dot{m} = \\alpha_w \\cdot A \\cdot \\sqrt{2 \\, \\rho \\, \\Delta p}',
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
    { id: 'A', symbol: 'A', name: 'Engster Strömungsquerschnitt', dimension: 'area', defaultUnit: 'mm2' },
    { id: 'rho', symbol: '\\rho', name: 'Dichte', dimension: 'density', defaultUnit: 'kgm3' },
    { id: 'dp', symbol: '\\Delta p', name: 'Druckdifferenz über dem Ventil', dimension: 'pressure', defaultUnit: 'bar' },
    { id: 'mdot', symbol: '\\dot{m}', name: 'Abzuführender Massenstrom', dimension: 'massFlow', defaultUnit: 'kgh' },
  ],
  zielgroessen: ['mdot', 'A'],
  compute: (bekannt, ziel): Record<string, number> => {
    if (bekannt.rho <= 0) throw new Error('Dichte muss größer 0 sein')
    if (bekannt.dp < 0) throw new Error('Druckdifferenz darf nicht negativ sein')
    const wurzelterm = Math.sqrt(2 * bekannt.rho * bekannt.dp)
    if (ziel === 'mdot') return { mdot: bekannt.alphaw * bekannt.A * wurzelterm }
    if (ziel === 'A') {
      if (bekannt.alphaw <= 0) throw new Error('Ausflussziffer muss größer 0 sein')
      return { A: bekannt.mdot / (bekannt.alphaw * wurzelterm) }
    }
    throw new Error(`Unbekannte Zielgröße "${ziel}"`)
  },
  gueltigkeit: 'Inkompressible Ausströmung einer Flüssigkeit durch eine Öffnung',
  annahmen: [
    'Physikalisch hergeleitete SI-Form (Ausflussgleichung für inkompressible Fluide) - keine normspezifischen Korrekturfaktoren nach ISO 4126-1 enthalten',
    'α_w ist ein vom Hersteller zuerkannter Wert, keine Tabelle hinterlegt',
  ],
  quelle: { werk: 'DIN EN ISO 4126-1; physikalisch hergeleitete Form, keine normspezifische Zahlenwertgleichung', unsicher: true },
  richtwert: true,
  beispiel: {
    // αw=0,6, A=2e-4 m², ρ=1000 kg/m³, Δp=5e5 Pa (5 bar)
    // ṁ = 0,6*2e-4*sqrt(2*1000*5e5) = 0,6*2e-4*31622,776601... = 3,794733
    bekannt: { alphaw: 0.6, A: 2e-4, rho: 1000, dp: 5e5 },
    ziel: 'mdot',
    erwartet: { mdot: 3.794733192 },
    toleranzRelativ: 1e-6,
  },
}
