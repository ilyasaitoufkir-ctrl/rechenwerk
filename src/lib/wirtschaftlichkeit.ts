/**
 * Einfache Wirtschaftlichkeitsrechnung mit konstanter jährlicher Einsparung
 * über die gesamte Nutzungsdauer (VDI-2067-Kurzrechnung). Für eine
 * schwankende Zahlungsreihe wäre eine Jahr-für-Jahr-Summe nötig - hier
 * bewusst vereinfacht, siehe annahmen in den jeweiligen Formel-Modulen.
 */

/** Statische Amortisationszeit t = I / E, in Jahren. */
export function statischeAmortisation(investitionEur: number, jaehrlicheEinsparungEur: number): number {
  if (jaehrlicheEinsparungEur <= 0) {
    throw new Error('Jährliche Einsparung muss größer 0 sein, sonst amortisiert sich die Investition nie')
  }
  return investitionEur / jaehrlicheEinsparungEur
}

/** Rentenbarwertfaktor (Kapitalwert einer gleichbleibenden jährlichen Zahlung). */
export function rentenbarwertfaktor(zinssatz: number, jahre: number): number {
  if (jahre <= 0) throw new Error('Nutzungsdauer muss größer 0 sein')
  if (zinssatz === 0) return jahre
  if (zinssatz <= -1) throw new Error('Zinssatz muss größer -100% sein')
  return (1 - (1 + zinssatz) ** -jahre) / zinssatz
}

/** Kapitalwiedergewinnungsfaktor (Annuitätenfaktor), Kehrwert des Rentenbarwertfaktors. */
export function kapitalwiedergewinnungsfaktor(zinssatz: number, jahre: number): number {
  return 1 / rentenbarwertfaktor(zinssatz, jahre)
}

/** Kapitalwert KW = -I + E · Rentenbarwertfaktor(i,n). */
export function kapitalwert(
  investitionEur: number,
  jaehrlicheEinsparungEur: number,
  zinssatz: number,
  jahre: number,
): number {
  return -investitionEur + jaehrlicheEinsparungEur * rentenbarwertfaktor(zinssatz, jahre)
}

/** Annuität a = -I · Kapitalwiedergewinnungsfaktor(i,n) + E. */
export function annuitaet(
  investitionEur: number,
  jaehrlicheEinsparungEur: number,
  zinssatz: number,
  jahre: number,
): number {
  return -investitionEur * kapitalwiedergewinnungsfaktor(zinssatz, jahre) + jaehrlicheEinsparungEur
}

/**
 * Interner Zinsfuß: löst Kapitalwert(i) = 0 per Bisektion.
 * Wirft eine Error mit Erklärung, wenn keine Lösung existiert (die
 * Einsparung deckt die Investition über die Nutzungsdauer nicht einmal
 * ohne Verzinsung, Kapitalwert bei i=0 ist bereits negativ).
 */
export function internerZinsfuss(
  investitionEur: number,
  jaehrlicheEinsparungEur: number,
  jahre: number,
): number {
  if (jaehrlicheEinsparungEur <= 0) {
    throw new Error('Jährliche Einsparung muss größer 0 sein')
  }
  const kwBeiNull = kapitalwert(investitionEur, jaehrlicheEinsparungEur, 0, jahre)
  if (kwBeiNull <= 0) {
    throw new Error(
      'Keine Lösung: Die Summe der Einsparungen deckt die Investition über die Nutzungsdauer nicht einmal ohne Verzinsung (Kapitalwert bei 0% bereits negativ oder null).',
    )
  }

  let lo = 0
  let hi = 100 // 10000% als sichere obere Schranke, KW(hi) -> -I < 0
  const kwHi = kapitalwert(investitionEur, jaehrlicheEinsparungEur, hi, jahre)
  if (kwHi > 0) {
    throw new Error('Keine Lösung gefunden: Kapitalwert bleibt auch bei sehr hohem Zinssatz positiv.')
  }

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const kwMid = kapitalwert(investitionEur, jaehrlicheEinsparungEur, mid, jahre)
    if (Math.abs(kwMid) < 1e-9) return mid
    if (kwMid > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
