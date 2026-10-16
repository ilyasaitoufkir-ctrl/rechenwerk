/**
 * Grundlagen der binären Rektifikation (McCabe-Thiele-Verfahren). Alle
 * Zusammensetzungen sind Molanteile der leichter siedenden Komponente.
 *
 * Quelle: Sigloch/Standardwerke der thermischen Verfahrenstechnik für die
 * Grundgleichungen (Gleichgewichtskurve, Fenske, McCabe-Thiele-Konstruktion);
 * Gilliland-Korrelation in der Form nach Eduljee (1975).
 */

/** Gleichgewichtskurve bei konstanter relativer Flüchtigkeit α: y = αx/(1+(α-1)x). */
export function gleichgewichtY(x: number, alpha: number): number {
  if (alpha <= 0) throw new Error('Relative Flüchtigkeit α muss größer 0 sein')
  return (alpha * x) / (1 + (alpha - 1) * x)
}

/** Umkehrfunktion der Gleichgewichtskurve: x aus gegebenem y. */
export function gleichgewichtX(y: number, alpha: number): number {
  if (alpha <= 0) throw new Error('Relative Flüchtigkeit α muss größer 0 sein')
  const nenner = alpha - (alpha - 1) * y
  if (Math.abs(nenner) < 1e-12) throw new Error('Gleichgewichtskurve nicht invertierbar (Nenner 0)')
  return y / nenner
}

/** q-Linie: y = q/(q-1)·x - x_F/(q-1). Sonderfall q=1 (senkrechte Linie bei x=x_F) separat behandeln. */
export function qLinieY(x: number, q: number, xF: number): number {
  if (Math.abs(q - 1) < 1e-9) throw new Error('q=1: q-Linie ist senkrecht, hat keine y=f(x)-Form')
  return (q / (q - 1)) * x - xF / (q - 1)
}

export interface Schnittpunkt {
  x: number
  y: number
}

/**
 * Schnittpunkt von q-Linie und Gleichgewichtskurve (für das
 * Mindestrücklaufverhältnis). Sonderfall q=1: x* = x_F direkt, sonst
 * numerische Nullstellensuche (Bisektion) von gleichgewicht(x) - qLinie(x).
 */
export function schnittQLinieGleichgewicht(alpha: number, xF: number, q: number): Schnittpunkt {
  if (xF <= 0 || xF >= 1) throw new Error('x_F muss zwischen 0 und 1 liegen')
  if (Math.abs(q - 1) < 1e-9) {
    const y = gleichgewichtY(xF, alpha)
    return { x: xF, y }
  }
  const f = (x: number) => gleichgewichtY(x, alpha) - qLinieY(x, q, xF)
  let lo = 1e-9
  let hi = 1 - 1e-9
  const fLo = f(lo)
  const fHi = f(hi)
  if (fLo * fHi > 0) {
    throw new Error('Kein Schnittpunkt von q-Linie und Gleichgewichtskurve im Intervall (0,1) gefunden')
  }
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const fMid = f(mid)
    if (fMid === 0) {
      lo = hi = mid
      break
    }
    if (fLo * fMid < 0) hi = mid
    else lo = mid
  }
  const x = (lo + hi) / 2
  return { x, y: gleichgewichtY(x, alpha) }
}

/** Mindestrücklaufverhältnis R_min = (x_D - y*) / (y* - x*). */
export function mindestrueckverhaeltnis(alpha: number, xF: number, xD: number, q: number): number {
  const { x, y } = schnittQLinieGleichgewicht(alpha, xF, q)
  if (Math.abs(y - x) < 1e-12) throw new Error('y* ≈ x* - Mindestrücklaufverhältnis nicht bestimmbar (Pinch bei x=y)')
  return (xD - y) / (y - x)
}

/** Fenske-Gleichung: minimale Stufenzahl bei totalem Rücklauf. */
export function fenskeMindeststufenzahl(alpha: number, xD: number, xB: number): number {
  if (alpha <= 1) throw new Error('Relative Flüchtigkeit α muss größer 1 sein')
  if (xD <= 0 || xD >= 1 || xB <= 0 || xB >= 1) throw new Error('x_D und x_B müssen zwischen 0 und 1 liegen')
  return Math.log((xD / (1 - xD)) * ((1 - xB) / xB)) / Math.log(alpha)
}

/** Gilliland-Korrelation in der Form nach Eduljee: Y = 0,75(1 - X^0,5668). */
export function gillilandY(X: number): number {
  if (X < 0 || X > 1) throw new Error('X muss zwischen 0 und 1 liegen')
  return 0.75 * (1 - Math.pow(X, 0.5668))
}

/** Theoretische Stufenzahl N aus Gilliland/Eduljee bei gegebenem R > R_min. */
export function gillilandStufenzahl(R: number, Rmin: number, Nmin: number): number {
  if (R <= Rmin) throw new Error('R muss größer als R_min sein')
  const X = (R - Rmin) / (R + 1)
  const Y = gillilandY(X)
  if (Y >= 1) throw new Error('Gilliland-Korrelation liefert keine endliche Stufenzahl (Y ≥ 1)')
  return (Nmin + Y) / (1 - Y)
}

export interface McCabeThieleStufe {
  /** Index der Stufe (1 = oberste) */
  nummer: number
  x: number
  y: number
  imAbtrieb: boolean
  /** y-Wert auf der Betriebsgeraden bei diesem x - für die Treppenkonstruktion im Diagramm */
  yNach: number
}

export interface McCabeThieleErgebnis {
  stufen: McCabeThieleStufe[]
  theoretischeStufenzahl: number
  zulaufstufe: number
  schnittpunktQLinie: Schnittpunkt
}

/**
 * Schnittpunkt von q-Linie und Verstärkungsgerade für ein gegebenes R - das
 * ist der Punkt, an dem Verstärkungs- und Abtriebsgerade zusammentreffen
 * (nicht zu verwechseln mit dem q-Linie/Gleichgewichtskurve-Schnittpunkt,
 * der nur für R_min gebraucht wird und unabhängig von R ist).
 */
function schnittQLinieBetriebsgerade(xD: number, xF: number, q: number, R: number): Schnittpunkt {
  const verstaerkungsgerade = (x: number) => (R / (R + 1)) * x + xD / (R + 1)
  if (Math.abs(q - 1) < 1e-9) {
    return { x: xF, y: verstaerkungsgerade(xF) }
  }
  const mQ = q / (q - 1)
  const bQ = -xF / (q - 1)
  const mR = R / (R + 1)
  const bR = xD / (R + 1)
  if (Math.abs(mQ - mR) < 1e-12) throw new Error('q-Linie und Verstärkungsgerade sind parallel')
  const x = (bR - bQ) / (mQ - mR)
  return { x, y: verstaerkungsgerade(x) }
}

/**
 * McCabe-Thiele-Stufenkonstruktion: stuft von (x_D,x_D) auf der Diagonale
 * ausgehend Stufen zwischen Gleichgewichtskurve und Betriebsgeraden ab, bis
 * x ≤ x_B erreicht ist. Wechselt von der Verstärkungs- zur Abtriebsgeraden,
 * sobald x unter den x-Wert des Betriebsgeraden-Schnittpunkts (auf der
 * q-Linie, abhängig von R) fällt.
 */
export function mcCabeThiele(
  alpha: number,
  xD: number,
  xB: number,
  xF: number,
  q: number,
  R: number,
): McCabeThieleErgebnis {
  if (xD <= xB) throw new Error('x_D muss größer als x_B sein')
  if (R <= 0) throw new Error('Rücklaufverhältnis R muss größer 0 sein')

  // Für die Zulaufstufen-Erkennung: Schnittpunkt der Betriebsgeraden (auf der q-Linie, abhängig von R)
  const schnitt = schnittQLinieBetriebsgerade(xD, xF, q, R)

  function verstaerkungsgerade(x: number): number {
    return (R / (R + 1)) * x + xD / (R + 1)
  }
  // Abtriebsgerade: Gerade durch (xB,xB) und den Betriebsgeraden-Schnittpunkt
  const steigungAbtrieb = (schnitt.y - xB) / (schnitt.x - xB)
  function abtriebsgerade(x: number): number {
    return steigungAbtrieb * (x - xB) + xB
  }

  const stufen: McCabeThieleStufe[] = []
  let x = xD
  let y = xD
  let zulaufstufe = -1
  const MAX_STUFEN = 200

  for (let i = 1; i <= MAX_STUFEN; i++) {
    const xGleichgewicht = gleichgewichtX(y, alpha)
    const imAbtrieb = xGleichgewicht < schnitt.x
    if (imAbtrieb && zulaufstufe === -1) zulaufstufe = i

    x = xGleichgewicht
    const yNach = imAbtrieb ? abtriebsgerade(x) : verstaerkungsgerade(x)
    stufen.push({ nummer: i, x, y, imAbtrieb, yNach })

    if (x <= xB) {
      return { stufen, theoretischeStufenzahl: i, zulaufstufe: zulaufstufe === -1 ? i : zulaufstufe, schnittpunktQLinie: schnitt }
    }

    y = yNach
  }

  throw new Error('Keine Konvergenz nach 200 Stufen - Rücklaufverhältnis zu nah an R_min?')
}
