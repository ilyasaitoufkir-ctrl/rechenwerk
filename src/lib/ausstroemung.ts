/**
 * Kritische (schallnahe) Ausströmung eines idealen Gases durch eine Öffnung,
 * z. B. Dampf- oder Druckluftleckage ins Freie. Gültig, wenn das
 * Druckverhältnis unter dem kritischen Druckverhältnis liegt (Ausströmung
 * ins Freie bei typischen Überdrücken immer erfüllt).
 *
 *   ṁ = C_d · A · √( κ · p_0 · ρ_0 · (2/(κ+1))^((κ+1)/(κ−1)) )
 *
 * Quelle: Bohl/Elmendorf, Technische Strömungslehre (kritische Ausströmung
 * idealer Gase). C_d und κ sind Richtwerte, das Ergebnis ist eine
 * Abschätzung der Größenordnung, keine Auslegungsrechnung.
 */
export function kritischeAusstroemung(
  cd: number,
  aM2: number,
  kappa: number,
  p0Pa: number,
  rho0KgM3: number,
): number {
  if (cd <= 0) throw new Error('Durchflusskoeffizient C_d muss größer 0 sein')
  if (aM2 <= 0) throw new Error('Öffnungsfläche muss größer 0 sein')
  if (kappa <= 1) throw new Error('Isentropenexponent κ muss größer 1 sein')
  if (p0Pa <= 0) throw new Error('Druck muss größer 0 sein')
  if (rho0KgM3 <= 0) throw new Error('Dichte muss größer 0 sein')

  const exponent = (kappa + 1) / (kappa - 1)
  const term = kappa * p0Pa * rho0KgM3 * (2 / (kappa + 1)) ** exponent
  return cd * aM2 * Math.sqrt(term)
}

/** Kritisches Druckverhältnis p_krit/p_0, unterhalb dessen die Strömung schallnah (choked) ist. */
export function kritischesDruckverhaeltnis(kappa: number): number {
  return (2 / (kappa + 1)) ** (kappa / (kappa - 1))
}
