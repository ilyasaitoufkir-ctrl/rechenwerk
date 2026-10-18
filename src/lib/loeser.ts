/**
 * Generisches "Auflösen nach jeder Größe": funktioniert automatisch für jede Formel der Registry,
 * ohne dass eine Formel etwas Besonderes dafür bereitstellen muss.
 *
 * Hat eine Formel bereits mehrere `zielgroessen` (analytische Umkehrung existiert bereits im
 * jeweiligen compute()-Zweig), wird diese direkt verwendet. Für alle anderen Variablen (reine
 * Eingaben) wird numerisch gelöst: Vorzeichenwechsel per Gitterabtastung suchen, dann mit dem
 * Brent-Verfahren auf relative Toleranz 1e-10 verfeinern. Werden mehrere Vorzeichenwechsel
 * gefunden, werden alle Lösungen zurückgegeben (Mehrdeutigkeit) statt eine davon zu wählen.
 */
import type { Formula, Variable } from '../types/formula'

export interface AufloesungsKandidat {
  wert: number
  /** Vollständiges compute()-Ergebnis bei diesem Kandidaten - Grundlage der Kontroll-Vorwärtsrechnung. */
  kontrolle: Record<string, number>
  /** false, wenn der Kandidat außerhalb der an der Variable hinterlegten min/max-Grenzen liegt. */
  gueltig: boolean
  warnungen: string[]
}

export interface AufloesungsErgebnis {
  methode: 'analytisch' | 'numerisch'
  kandidaten: AufloesungsKandidat[]
  fehler?: string
}

/** Jede Variable einer Formel kann grundsätzlich als "Gesucht" gewählt werden. */
export function moeglicheGesuchte(formel: Formula): string[] {
  return formel.variablen.map((v) => v.id)
}

function pruefeGueltigkeit(variable: Variable, wert: number): boolean {
  if (variable.min !== undefined && wert < variable.min) return false
  if (variable.max !== undefined && wert > variable.max) return false
  return true
}

function werteSicher(f: (x: number) => number, x: number): number | null {
  try {
    const v = f(x)
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

/**
 * Brent-Verfahren (Dekker/Brent, Standardalgorithmus) für eine Nullstelle von f in [a, b],
 * vorausgesetzt f(a) und f(b) haben unterschiedliches Vorzeichen.
 */
export function brent(f: (x: number) => number, a0: number, b0: number, tol = 1e-10, maxIter = 100): number {
  let a = a0
  let b = b0
  let fa = f(a)
  let fb = f(b)
  if (fa === 0) return a
  if (fb === 0) return b
  if (fa * fb > 0) throw new Error('Kein Vorzeichenwechsel im Intervall')
  if (Math.abs(fa) < Math.abs(fb)) {
    ;[a, b] = [b, a]
    ;[fa, fb] = [fb, fa]
  }
  let c = a
  let fc = fa
  let d = a
  let mflag = true
  for (let i = 0; i < maxIter; i++) {
    if (fb === 0 || Math.abs(b - a) < tol * Math.max(1, Math.abs(b))) return b
    let s: number
    if (fa !== fc && fb !== fc) {
      s =
        (a * fb * fc) / ((fa - fb) * (fa - fc)) +
        (b * fa * fc) / ((fb - fa) * (fb - fc)) +
        (c * fa * fb) / ((fc - fa) * (fc - fb))
    } else {
      s = b - (fb * (b - a)) / (fb - fa)
    }
    const min1 = Math.min(a, b)
    const max1 = Math.max(a, b)
    const cond1 = s < min1 || s > max1
    const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2
    const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2
    const cond4 = mflag && Math.abs(b - c) < tol
    const cond5 = !mflag && Math.abs(c - d) < tol
    if (cond1 || cond2 || cond3 || cond4 || cond5) {
      s = (a + b) / 2
      mflag = true
    } else {
      mflag = false
    }
    const fs = f(s)
    d = c
    c = b
    fc = fb
    if (fa * fs < 0) {
      b = s
      fb = fs
    } else {
      a = s
      fa = fs
    }
    if (Math.abs(fa) < Math.abs(fb)) {
      ;[a, b] = [b, a]
      ;[fa, fb] = [fb, fa]
    }
  }
  return b
}

function sichererBrent(f: (x: number) => number, a: number, b: number): number | null {
  try {
    return brent(f, a, b)
  } catch {
    return null
  }
}

/** 18 Punkte pro Dekade (Mantisse 1..9,5 in 0,5er-Schritten) von 1e-9 bis 1e12 - deckt sowohl
 * sehr kleine SI-Werte (z. B. Rauheit k ≈ 1e-9 m) als auch sehr große (Energien in Joule,
 * ≈ 1e11) ab, und ist fein genug, um auch Nullstellen zu finden, die direkt neben einer inneren
 * Definitionslücke liegen (z. B. eine formelinterne Gültigkeitsgrenze mitten in einer Dekade). */
function positiveLogGitter(): number[] {
  const pts: number[] = []
  for (let exp = -9; exp <= 12; exp++) {
    for (let mantisse = 1; mantisse <= 9.5; mantisse += 0.5) {
      pts.push(mantisse * Math.pow(10, exp))
    }
  }
  return pts
}

const LOG_GITTER_POSITIV = positiveLogGitter()

/** Faktoren für eine Nahbereichs-Abtastung direkt an einer harten Grenze (min/max) oder einer
 * typischen Singularitätsstelle (0, ±1 - z. B. Isentropenexponent κ > 1 oder ein Nenner x−1) -
 * dort ist der Grenzwert/die Singularität selbst meist nicht auswertbar, sodass das grobe
 * Dekaden-Gitter eine nahe Nullstelle sonst überspringen könnte. */
const GRENZ_PROBE_FAKTOREN = [1e-6, 1e-4, 1e-3, 1e-2, 0.03, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5, 8, 13, 21, 34, 55]
const UNIVERSELLE_SINGULARITAETEN = [0, 1, -1]

function singularitaetenProbe(): number[] {
  const pts: number[] = []
  for (const s of UNIVERSELLE_SINGULARITAETEN) {
    for (const f of GRENZ_PROBE_FAKTOREN) {
      pts.push(s + f, s - f)
    }
  }
  return pts
}

/** Abtastgitter zur Suche von Vorzeichenwechseln: nutzt min/max der Variable, falls vorhanden, sonst ein beidseitig log-verteiltes Gitter (positiv und negativ, 0 ausgenommen). */
function kandidatenGitter(variable: Variable): number[] {
  const hatMin = variable.min !== undefined
  const hatMax = variable.max !== undefined

  if (hatMin && hatMax) {
    const n = 400
    const pts: number[] = []
    for (let i = 0; i <= n; i++) {
      pts.push(variable.min! + ((variable.max! - variable.min!) * i) / n)
    }
    for (const s of singularitaetenProbe()) {
      if (s > variable.min! && s < variable.max!) pts.push(s)
    }
    return [...new Set(pts)].sort((a, b) => a - b)
  }

  let pts = [...LOG_GITTER_POSITIV, ...LOG_GITTER_POSITIV.map((m) => -m), ...singularitaetenProbe()].sort((a, b) => a - b)
  if (hatMin) {
    const ref = Math.max(1, Math.abs(variable.min!))
    const probe = GRENZ_PROBE_FAKTOREN.map((f) => variable.min! + f * ref)
    pts = [variable.min!, ...probe, ...pts.filter((x) => x > variable.min!)]
  }
  if (hatMax) {
    const ref = Math.max(1, Math.abs(variable.max!))
    const probe = GRENZ_PROBE_FAKTOREN.map((f) => variable.max! - f * ref)
    pts = [...pts.filter((x) => x < variable.max!), ...probe, variable.max!]
  }
  return [...new Set(pts)].sort((a, b) => a - b)
}

/** Erkennt den Entartungsfall, dass eine Variable das Ergebnis in dieser Richtung gar nicht
 * beeinflusst (z. B. nur in einem anderen compute()-Zweig verwendet) - sonst würde jeder
 * Gitterpunkt fälschlich als "Lösung" erscheinen, weil das Residuum überall exakt gleich ist. */
function istEntartetKonstant(gueltigeWerte: number[]): boolean {
  if (gueltigeWerte.length < 2) return false
  const min = Math.min(...gueltigeWerte)
  const max = Math.max(...gueltigeWerte)
  return max - min < 1e-9 * Math.max(1, Math.abs(max), Math.abs(min))
}

function residuumsToleranz(zielWert: number): number {
  return 1e-9 * Math.max(1, Math.abs(zielWert))
}

function dedupliziere(werte: number[]): number[] {
  const sortiert = [...werte].sort((a, b) => a - b)
  const ergebnis: number[] = []
  for (const w of sortiert) {
    const letzter = ergebnis[ergebnis.length - 1]
    if (letzter === undefined || Math.abs(w - letzter) > 1e-6 * Math.max(1, Math.abs(w))) {
      ergebnis.push(w)
    }
  }
  return ergebnis
}

/**
 * Löst eine Formel nach einer beliebigen Variable auf. `bekanntRestSI` muss alle übrigen
 * Variablenwerte in SI enthalten, die für diese Richtung benötigt werden (siehe
 * `benoetigteEingaben` für die exakte Liste je gewählter Zielgröße).
 */
export function loeseNachVariable(formel: Formula, geloestId: string, bekanntRestSI: Record<string, number>): AufloesungsErgebnis {
  const variable = formel.variablen.find((v) => v.id === geloestId)
  if (!variable) {
    return { methode: 'analytisch', kandidaten: [], fehler: `Variable "${geloestId}" ist in dieser Formel nicht definiert.` }
  }
  const zusatzSet = new Set(formel.zusatzAusgaben ?? [])

  // Fall A/B: geloestId ist bereits eine (analytisch lösbare) Zielgröße oder eine Nebenausgabe -
  // direkte Vorwärtsrechnung, kein numerisches Lösen nötig.
  if (formel.zielgroessen.includes(geloestId) || zusatzSet.has(geloestId)) {
    const ziel = formel.zielgroessen.includes(geloestId) ? geloestId : formel.zielgroessen[0]
    let roh: Record<string, number>
    try {
      roh = formel.compute(bekanntRestSI, ziel)
    } catch (e) {
      return { methode: 'analytisch', kandidaten: [], fehler: e instanceof Error ? e.message : 'Unbekannter Rechenfehler.' }
    }
    const wert = roh[geloestId]
    if (!Number.isFinite(wert)) {
      return { methode: 'analytisch', kandidaten: [], fehler: 'Ergebnis ist nicht definiert (z. B. Division durch 0 oder außerhalb des gültigen Bereichs).' }
    }
    const warnungen = formel.warnungen?.(bekanntRestSI, ziel, roh) ?? []
    return {
      methode: 'analytisch',
      kandidaten: [{ wert, kontrolle: roh, gueltig: pruefeGueltigkeit(variable, wert), warnungen }],
    }
  }

  // Fall C: geloestId ist eine reine Eingabe - numerisch über die primäre Zielgröße lösen.
  const ziel = formel.zielgroessen[0]
  const zielWert = bekanntRestSI[ziel]
  if (zielWert === undefined || !Number.isFinite(zielWert)) {
    return {
      methode: 'numerisch',
      kandidaten: [],
      fehler: `Für das Auflösen nach "${variable.name}" wird ein Wert für "${ziel}" benötigt.`,
    }
  }

  function residuum(x: number): number {
    const roh = formel.compute({ ...bekanntRestSI, [geloestId]: x }, ziel)
    const r = roh[ziel]
    if (!Number.isFinite(r)) throw new Error('Ergebnis an dieser Stelle nicht definiert.')
    return r - zielWert
  }

  const gitter = kandidatenGitter(variable)
  const auswertungen = gitter.map((x) => ({ x, f: werteSicher(residuum, x) }))

  const gueltigeWerte = auswertungen.map((a) => a.f).filter((f): f is number => f !== null)
  if (gueltigeWerte.length === 0) {
    return { methode: 'numerisch', kandidaten: [], fehler: 'Für keinen untersuchten Wert ist die Formel in dieser Richtung definiert.' }
  }
  if (istEntartetKonstant(gueltigeWerte)) {
    return {
      methode: 'numerisch',
      kandidaten: [],
      fehler: `Das Ergebnis hängt in dieser Richtung nicht von "${variable.name}" ab - diese Größe kann hier nicht aufgelöst werden.`,
    }
  }

  const toleranz = residuumsToleranz(zielWert)
  const wurzeln: number[] = []

  // Gitterpunkte, die selbst schon (nahezu) eine Nullstelle sind - wichtig an Rändern, wo der
  // direkte Nachbarpunkt außerhalb des Definitionsbereichs liegt (compute() würfe dort).
  for (const a of auswertungen) {
    if (a.f !== null && Math.abs(a.f) < toleranz) wurzeln.push(a.x)
  }

  for (let i = 0; i < auswertungen.length - 1; i++) {
    const p1 = auswertungen[i]
    const p2 = auswertungen[i + 1]
    if (p1.f === null || p2.f === null) continue
    if (p1.f * p2.f < 0) {
      const wurzel = sichererBrent(residuum, p1.x, p2.x)
      if (wurzel !== null) wurzeln.push(wurzel)
    }
  }

  // Verifikation: jeder Kandidat muss sein eigenes Residuum tatsächlich auf ~0 bringen - verwirft
  // numerische Artefakte (z. B. nicht konvergierte innere Iterationen bei extremen Eingaben).
  const verifiziert = wurzeln.filter((x) => {
    const r = werteSicher(residuum, x)
    return r !== null && Math.abs(r) < toleranz * 1e3
  })

  const eindeutige = dedupliziere(verifiziert)
  if (eindeutige.length === 0) {
    return { methode: 'numerisch', kandidaten: [], fehler: 'Keine Lösung im untersuchten Wertebereich gefunden.' }
  }
  // Schutz gegen Fast-Entartung, die die einfache Varianzprüfung oben nicht erfasst hat (z. B.
  // durch Gleitkommarauschen eines inneren Lösers): eine dreistellige "Lösungsmenge" ist keine
  // echte Mehrdeutigkeit, sondern ein Zeichen, dass die Variable das Ergebnis hier praktisch
  // nicht eindeutig beeinflusst - lieber das ehrlich melden als eine Wand aus Zahlen zeigen.
  if (eindeutige.length > 20) {
    return {
      methode: 'numerisch',
      kandidaten: [],
      fehler: `"${variable.name}" lässt sich hier nicht eindeutig auflösen (zu viele rechnerisch mögliche Werte - das Ergebnis hängt praktisch nicht eindeutig davon ab).`,
    }
  }

  const kandidaten: AufloesungsKandidat[] = eindeutige.map((x) => {
    const bekanntMitLoesung = { ...bekanntRestSI, [geloestId]: x }
    const roh = formel.compute(bekanntMitLoesung, ziel)
    const warnungen = formel.warnungen?.(bekanntMitLoesung, ziel, roh) ?? []
    return { wert: x, kontrolle: roh, gueltig: pruefeGueltigkeit(variable, x), warnungen }
  })

  return { methode: 'numerisch', kandidaten }
}

/**
 * Liste der Variablen-IDs, deren SI-Werte in `bekanntRestSI` vorhanden sein müssen, um nach
 * `geloestId` aufzulösen - für die UI, um die passenden Eingabefelder anzuzeigen.
 */
export function benoetigteEingaben(formel: Formula, geloestId: string): string[] {
  const zusatzSet = new Set(formel.zusatzAusgaben ?? [])
  if (zusatzSet.has(geloestId)) {
    const ausgabeIds = new Set([formel.zielgroessen[0], ...zusatzSet])
    return formel.variablen.filter((v) => !ausgabeIds.has(v.id)).map((v) => v.id)
  }
  if (formel.zielgroessen.includes(geloestId)) {
    const ausgabeIds = new Set([geloestId, ...zusatzSet])
    return formel.variablen.filter((v) => !ausgabeIds.has(v.id)).map((v) => v.id)
  }
  return formel.variablen.filter((v) => v.id !== geloestId && !zusatzSet.has(v.id)).map((v) => v.id)
}
