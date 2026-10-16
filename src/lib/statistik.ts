/**
 * Statistische Grundfunktionen für Messreihen: Lagemaße, Streuung,
 * t-Verteilung (für Vertrauensbereiche) und lineare Regression. Alles
 * selbst implementiert, keine externe Statistikbibliothek.
 *
 * Die t-Verteilung wird über die regularisierte unvollständige
 * Betafunktion berechnet (Numerical-Recipes-Verfahren: Lanczos-
 * Approximation für die Gammafunktion, Kettenbruch für die Betafunktion).
 * Das Quantil (für Vertrauensintervalle) wird per Bisektion auf der
 * t-Verteilungsfunktion gesucht, nicht aus einer abgetippten Tabelle.
 */

export interface Kennwerte {
  n: number
  mittelwert: number
  median: number
  stabw: number // Stichproben-Standardabweichung (n-1)
  variationskoeffizient: number
  min: number
  max: number
  spannweite: number
}

export function berechneKennwerte(werte: number[]): Kennwerte {
  if (werte.length === 0) throw new Error('Messreihe darf nicht leer sein')
  const n = werte.length
  const mittelwert = werte.reduce((a, b) => a + b, 0) / n
  const sortiert = [...werte].sort((a, b) => a - b)
  const median =
    n % 2 === 1 ? sortiert[(n - 1) / 2] : (sortiert[n / 2 - 1] + sortiert[n / 2]) / 2
  const stabw =
    n > 1
      ? Math.sqrt(werte.reduce((sum, x) => sum + (x - mittelwert) ** 2, 0) / (n - 1))
      : 0
  const variationskoeffizient = mittelwert !== 0 ? stabw / mittelwert : NaN
  const min = sortiert[0]
  const max = sortiert[n - 1]
  return { n, mittelwert, median, stabw, variationskoeffizient, min, max, spannweite: max - min }
}

// --- Gammafunktion (Lanczos-Approximation, g=7, n=9) ---------------------
const LANCZOS_G = 7
const LANCZOS_COEF = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
]

function logGamma(x: number): number {
  if (x < 0.5) {
    // Reflexionsformel
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const xx = x - 1
  let a = LANCZOS_COEF[0]
  const t = xx + LANCZOS_G + 0.5
  for (let i = 1; i < LANCZOS_G + 2; i++) {
    a += LANCZOS_COEF[i] / (xx + i)
  }
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a)
}

// --- Regularisierte unvollständige Betafunktion I_x(a,b) ------------------
// Kettenbruchentwicklung nach Numerical Recipes (betacf)
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200
  const EPS = 3e-16
  const FPMIN = 1e-300

  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d

  for (let m = 1, m2 = 2; m <= MAXIT; m++, m2 += 2) {
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const logBeta = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  const front = Math.exp(logBeta)
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betacf(x, a, b)) / a
  }
  return 1 - (front * betacf(1 - x, b, a)) / b
}

/** Verteilungsfunktion (kumulierte Wahrscheinlichkeit) der t-Verteilung mit ν Freiheitsgraden. */
export function tCDF(t: number, df: number): number {
  if (df <= 0) throw new Error('Freiheitsgrade müssen größer 0 sein')
  const x = df / (df + t * t)
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5)
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib
}

/**
 * Quantil (inverse Verteilungsfunktion) der t-Verteilung: löst t mit
 * tCDF(t, df) = p per Bisektion. p z. B. 0,975 für ein zweiseitiges
 * 95%-Vertrauensintervall.
 */
export function tQuantil(p: number, df: number): number {
  if (p <= 0 || p >= 1) throw new Error('p muss zwischen 0 und 1 liegen')
  let lo = -100
  let hi = 100
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (tCDF(mid, df) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Zweiseitiges Vertrauensintervall des Mittelwerts:
 * x̄ ± t(1-α/2, n-1) · s/√n
 */
export function vertrauensbereichMittelwert(
  werte: number[],
  vertrauensniveau: number,
): { mittelwert: number; halbbreite: number; untergrenze: number; obergrenze: number } {
  const { n, mittelwert, stabw } = berechneKennwerte(werte)
  if (n < 2) throw new Error('Für ein Vertrauensintervall werden mindestens 2 Werte benötigt')
  const alpha = 1 - vertrauensniveau
  const t = tQuantil(1 - alpha / 2, n - 1)
  const halbbreite = (t * stabw) / Math.sqrt(n)
  return { mittelwert, halbbreite, untergrenze: mittelwert - halbbreite, obergrenze: mittelwert + halbbreite }
}

export interface RegressionsErgebnis {
  steigung: number
  achsenabschnitt: number
  r2: number
  residuen: number[]
}

/** Einfache lineare Regression y = steigung*x + achsenabschnitt (Methode der kleinsten Quadrate). */
export function lineareRegression(x: number[], y: number[]): RegressionsErgebnis {
  if (x.length !== y.length) throw new Error('x und y müssen gleich lang sein')
  const n = x.length
  if (n < 2) throw new Error('Für eine Regression werden mindestens 2 Punkte benötigt')
  const xMittel = x.reduce((a, b) => a + b, 0) / n
  const yMittel = y.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - xMittel) * (y[i] - yMittel)
    sxx += (x[i] - xMittel) ** 2
  }
  if (sxx === 0) throw new Error('Alle x-Werte sind identisch - keine Regression möglich')
  const steigung = sxy / sxx
  const achsenabschnitt = yMittel - steigung * xMittel

  const residuen = x.map((xi, i) => y[i] - (steigung * xi + achsenabschnitt))
  const ssRes = residuen.reduce((sum, r) => sum + r * r, 0)
  const ssTot = y.reduce((sum, yi) => sum + (yi - yMittel) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { steigung, achsenabschnitt, r2, residuen }
}

export interface QuadratischeRegression {
  a: number
  b: number
  c: number
}

/**
 * Quadratische Ausgleichskurve y = a + b·x + c·x² (Methode der kleinsten
 * Quadrate über die Normalgleichungen, 3x3-Gleichungssystem per
 * Cramer-Regel gelöst). Für z. B. eine Pumpenkennlinie aus Datenblattpunkten.
 */
export function quadratischeRegression(x: number[], y: number[]): QuadratischeRegression {
  if (x.length !== y.length) throw new Error('x und y müssen gleich lang sein')
  const n = x.length
  if (n < 3) throw new Error('Für eine quadratische Ausgleichskurve werden mindestens 3 Punkte benötigt')

  let Sx = 0,
    Sx2 = 0,
    Sx3 = 0,
    Sx4 = 0,
    Sy = 0,
    Sxy = 0,
    Sx2y = 0
  for (let i = 0; i < n; i++) {
    const xi = x[i]
    const yi = y[i]
    const xi2 = xi * xi
    Sx += xi
    Sx2 += xi2
    Sx3 += xi2 * xi
    Sx4 += xi2 * xi2
    Sy += yi
    Sxy += xi * yi
    Sx2y += xi2 * yi
  }

  // Normalgleichungen als 3x3-System M * [a,b,c]^T = v
  const M = [
    [n, Sx, Sx2],
    [Sx, Sx2, Sx3],
    [Sx2, Sx3, Sx4],
  ]
  const v = [Sy, Sxy, Sx2y]

  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

  const D = det3(M)
  if (Math.abs(D) < 1e-12) {
    throw new Error('Keine eindeutige Ausgleichskurve möglich (z. B. alle x-Werte identisch)')
  }

  const mit = (col: number) => M.map((row, i) => row.map((val, j) => (j === col ? v[i] : val)))
  const a = det3(mit(0)) / D
  const b = det3(mit(1)) / D
  const c = det3(mit(2)) / D
  return { a, b, c }
}

/** Parst eine aus Excel eingefügte Spalte/Zeile: Tab, Semikolon, Komma oder Zeilenumbruch getrennt, deutsches Dezimalkomma. */
export function parseMessreihe(text: string): number[] {
  const teile = text
    .split(/[\t\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
  const werte: number[] = []
  for (const teil of teile) {
    const normalisiert = teil.includes(',') ? teil.replace(/\./g, '').replace(',', '.') : teil
    const zahl = Number(normalisiert)
    if (Number.isFinite(zahl)) werte.push(zahl)
  }
  return werte
}
