/**
 * IAPWS-IF97: Revised Release on the IAPWS Industrial Formulation 1997 for
 * the Thermodynamic Properties of Water and Steam (August 2007),
 * http://www.iapws.org/relguide/IF97-Rev.html
 *
 * Implementiert sind ausschließlich:
 *   - Region 1 (kompressible Flüssigkeit)
 *   - Region 2 (Dampf/Gas, Grundgleichung + idealer Anteil)
 *   - Region 4 (Sättigungslinie, Gl. 30 für p_s(T) bzw. Gl. 31 für T_s(p))
 *
 * Region 3 (überkritisches Gebiet um den kritischen Punkt) ist NICHT
 * implementiert. Deshalb wird der Gültigkeitsbereich konservativ auf
 * T ≤ 623,15 K bzw. p ≤ 16,5291642526 MPa (exakter Grenzpunkt der
 * Region-1/2/3-Grenzkurve, Referenzwert Ps_623 aus dem IAPWS-Dokument beschränkt - es wird nie extrapoliert.
 * Koeffiziententabellen numerisch gegen die offiziellen Verifikationswerte
 * aus dem IAPWS-Dokument geprüft (siehe iapws-if97.test.ts).
 */

export const R_WASSER = 0.461526 // kJ/(kg·K), spezifische Gaskonstante Wasser
export const T_KRITISCH = 647.096 // K
export const P_KRITISCH = 22.064 // MPa
/** Exakter Grenzpunkt der Region-1/2/3-Grenzkurve (p_s bei 623,15 K) */
export const P_GRENZE_MPA = 16.5291642526
export const T_GRENZE_K = 623.15
export const T_MIN_K = 273.15

function pruefeRegion1(T: number, pMPa: number): void {
  if (T < T_MIN_K || T > T_GRENZE_K) {
    throw new Error(
      `Temperatur ${(T - 273.15).toFixed(2)} °C außerhalb des implementierten Bereichs (0-350 °C) für Region 1 (Flüssigkeit).`,
    )
  }
  const ps = psatT(T)
  if (pMPa < ps - 1e-9 || pMPa > 100) {
    throw new Error(
      `Druck ${pMPa.toFixed(4)} MPa liegt für ${(T - 273.15).toFixed(2)} °C außerhalb von Region 1 (Flüssigkeit muss bei p ≥ p_s(T) = ${ps.toFixed(4)} MPa liegen, sonst verdampft es).`,
    )
  }
}

// Grenzkurve Region 2/3, IAPWS-IF97 Gl. 5: p_B23(T) = n0 + n1·T + n2·T²
// Referenzwert: p_B23(623,15 K) = 16,52916425 MPa (exakt wie P_GRENZE_MPA)
const B23_N = [0.34805185628969e3, -0.11671859879975e1, 0.10192970039326e-2]
function pGrenzeRegion23(T: number): number {
  return B23_N[0] + B23_N[1] * T + B23_N[2] * T * T
}
/** Obere Temperaturgrenze von Region 3 - oberhalb davon gibt es kein Region-3-Gebiet mehr. */
const T_MAX_REGION3_K = 863.15

function pruefeRegion2(T: number, pMPa: number): void {
  if (T < T_MIN_K || T > 1073.15) {
    throw new Error(
      `Temperatur ${(T - 273.15).toFixed(2)} °C außerhalb des implementierten Bereichs für Region 2 (Dampf).`,
    )
  }
  if (pMPa <= 0) throw new Error('Druck muss größer 0 sein.')
  if (pMPa > 100) {
    throw new Error(`Druck ${pMPa.toFixed(4)} MPa außerhalb des IAPWS-IF97-Gesamtbereichs (max. 100 MPa).`)
  }
  if (T <= T_GRENZE_K) {
    const ps = psatT(T)
    if (pMPa > ps + 1e-9) {
      throw new Error(
        `Druck ${pMPa.toFixed(4)} MPa liegt für ${(T - 273.15).toFixed(2)} °C außerhalb von Region 2 (Dampf muss bei p ≤ p_s(T) = ${ps.toFixed(4)} MPa liegen, sonst kondensiert es).`,
      )
    }
  } else if (T <= T_MAX_REGION3_K) {
    const pGrenze = pGrenzeRegion23(T)
    if (pMPa > pGrenze) {
      throw new Error(
        `Druck ${pMPa.toFixed(4)} MPa liegt bei ${(T - 273.15).toFixed(2)} °C oberhalb der Region-2/3-Grenzkurve (${pGrenze.toFixed(4)} MPa) - das wäre Region 3, die hier nicht implementiert ist.`,
      )
    }
  }
  // Für T > 863,15 K existiert kein Region-3-Gebiet mehr, jeder Druck ≤ 100 MPa ist Region 2.
}

export interface Zustand {
  /** Spezifisches Volumen, m³/kg */
  v: number
  /** Spezifische Enthalpie, J/kg */
  h: number
  /** Spezifische Entropie, J/(kg·K) */
  s: number
  /** Spezifische innere Energie, J/kg */
  u: number
  /** Spezifische isobare Wärmekapazität, J/(kg·K) */
  cp: number
  /** Dichte, kg/m³ */
  rho: number
}

// ---- Region 1 ----------------------------------------------------------

const R1_I = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 8, 8, 21, 23, 29,
  30, 31, 32,
]
const R1_J = [
  -2, -1, 0, 1, 2, 3, 4, 5, -9, -7, -1, 0, 1, 3, -3, 0, 1, 3, 17, -4, 0, 6, -5, -2, 10, -8, -11,
  -6, -29, -31, -38, -39, -40, -41,
]
const R1_N = [
  0.14632971213167, -0.84548187169114, -3.756360367204, 0.33855169168385e1, -0.95791963387872,
  0.15772038513228, -0.16616417199501e-1, 0.81214629983568e-3, 0.28319080123804e-3,
  -0.60706301565874e-3, -0.18990068218419e-1, -0.32529748770505e-1, -0.21841717175414e-1,
  -0.52838357969930e-4, -0.47184321073267e-3, -0.30001780793026e-3, 0.47661393906987e-4,
  -0.44141845330846e-5, -0.72694996297594e-15, -0.31679644845054e-4, -0.28270797985312e-5,
  -0.85205128120103e-9, -0.22425281908000e-5, -0.65171222895601e-6, -0.14341729937924e-12,
  -0.40516996860117e-6, -0.12734301741641e-8, -0.17424871230634e-9, -0.68762131295531e-18,
  0.14478307828521e-19, 0.26335781662795e-22, -0.11947622640071e-22, 0.18228094581404e-23,
  -0.93537087292458e-25,
]

/** Region 1 (Flüssigkeit). T in K, p in MPa. */
export function region1(T: number, pMPa: number): Zustand {
  pruefeRegion1(T, pMPa)
  const tau = 1386 / T
  const pi = pMPa / 16.53
  let g = 0,
    gp = 0,
    gt = 0,
    gtt = 0
  for (let i = 0; i < R1_N.length; i++) {
    const I = R1_I[i],
      J = R1_J[i],
      n = R1_N[i]
    g += n * (7.1 - pi) ** I * (tau - 1.222) ** J
    gp += -n * I * (7.1 - pi) ** (I - 1) * (tau - 1.222) ** J
    gt += n * J * (7.1 - pi) ** I * (tau - 1.222) ** (J - 1)
    gtt += n * J * (J - 1) * (7.1 - pi) ** I * (tau - 1.222) ** (J - 2)
  }
  const v = (pi * gp * R_WASSER * T) / (pMPa * 1000) // m³/kg
  const h = tau * gt * R_WASSER * T * 1000 // J/kg
  const s = R_WASSER * (tau * gt - g) * 1000 // J/(kg·K)
  const cp = -R_WASSER * tau * tau * gtt * 1000 // J/(kg·K)
  const u = h - pMPa * 1e6 * v
  return { v, h, s, u, cp, rho: 1 / v }
}

// ---- Region 2 -----------------------------------------------------------

const R2_I = [
  1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10, 10,
  16, 16, 18, 20, 20, 20, 21, 22, 23, 24, 24, 24,
]
const R2_J = [
  0, 1, 2, 3, 6, 1, 2, 4, 7, 36, 0, 1, 3, 6, 35, 1, 2, 3, 7, 3, 16, 35, 0, 11, 25, 8, 36, 13, 4,
  10, 14, 29, 50, 57, 20, 35, 48, 21, 53, 39, 26, 40, 58,
]
const R2_N = [
  -0.0017731742473213, -0.017834862292358, -0.045996013696365, -0.057581259083432,
  -0.05032527872793, -0.000033032641670203, -0.00018948987516315, -0.0039392777243355,
  -0.043797295650573, -0.000026674547914087, 2.0481737692309e-8, 4.3870667284435e-7,
  -0.000032277677238570002, -0.0015033924542148, -0.040668253562649, -7.8847309559367e-10,
  1.2790717852285e-8, 4.8225372718507e-7, 0.0000022922076337661, -1.6714766451061e-11,
  -0.0021171472321355, -23.895741934104, -5.905956432427e-18, -0.0000012621808899101,
  -0.038946842435739, 1.1256211360459e-11, -8.2311340897998, 1.9809712802088e-8,
  1.0406965210174e-19, -1.0234747095929e-13, -1.0018179379511e-9, -8.0882908646985e-11,
  0.10693031879409, -0.33662250574171, 8.9185845355421e-25, 3.0629316876232e-13,
  -0.0000042002467698208, -5.9056029685639e-26, 0.0000037826947613457, -1.2768608934681e-15,
  7.3087610595061e-29, 5.5414715350778e-17, -9.4369707241210e-7,
]

const R2_CP0_J = [0, 1, -5, -4, -3, -2, -1, 2, 3]
const R2_CP0_N = [
  -9.6927686500217, 10.086655968018, -0.0056087911283020, 0.071452738081455,
  -0.40710498223928, 1.4240819171444, -4.3839511319450, -0.28408632460772, 0.021268463753307,
]

/** Region 2 (Dampf). T in K, p in MPa. */
export function region2(T: number, pMPa: number): Zustand {
  pruefeRegion2(T, pMPa)
  const tau = 540 / T
  const pi = pMPa / 1

  let go = Math.log(pi),
    got = 0,
    gott = 0
  for (let i = 0; i < R2_CP0_N.length; i++) {
    const J = R2_CP0_J[i],
      n = R2_CP0_N[i]
    go += n * tau ** J
    got += n * J * tau ** (J - 1)
    gott += n * J * (J - 1) * tau ** (J - 2)
  }

  let gr = 0,
    grp = 0,
    grt = 0,
    grtt = 0
  for (let i = 0; i < R2_N.length; i++) {
    const I = R2_I[i],
      J = R2_J[i],
      n = R2_N[i]
    gr += n * pi ** I * (tau - 0.5) ** J
    grp += n * I * pi ** (I - 1) * (tau - 0.5) ** J
    grt += n * J * pi ** I * (tau - 0.5) ** (J - 1)
    grtt += n * J * (J - 1) * pi ** I * (tau - 0.5) ** (J - 2)
  }

  const v = (pi * (1 / pi + grp) * R_WASSER * T) / (pMPa * 1000) // m³/kg
  const h = tau * (got + grt) * R_WASSER * T * 1000 // J/kg
  const s = R_WASSER * (tau * (got + grt) - (go + gr)) * 1000 // J/(kg·K)
  const cp = -R_WASSER * tau * tau * (gott + grtt) * 1000 // J/(kg·K)
  const u = h - pMPa * 1e6 * v
  return { v, h, s, u, cp, rho: 1 / v }
}

// ---- Region 4 (Sättigungslinie) -----------------------------------------

const N4 = [
  0, 1167.0521452767, -724213.16703206, -17.073846940092, 12020.82470247, -3232555.0322333,
  14.91510861353, -4823.2657361591, 405113.40542057, -0.23855557567849, 650.17534844798,
]

/** Sättigungsdruck p_s(T), Gl. 30. T in K (273,15-647,096 K), Ergebnis in MPa. */
export function psatT(T: number): number {
  if (T < T_MIN_K || T > T_KRITISCH) {
    throw new Error(
      `Temperatur ${(T - 273.15).toFixed(2)} °C außerhalb der Sättigungslinie (0,01-373,95 °C).`,
    )
  }
  const tita = T + N4[9] / (T - N4[10])
  const A = tita * tita + N4[1] * tita + N4[2]
  const B = N4[3] * tita * tita + N4[4] * tita + N4[5]
  const C = N4[6] * tita * tita + N4[7] * tita + N4[8]
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4
}

/** Sättigungstemperatur T_s(p), Gl. 31. p in MPa, Ergebnis in K. */
export function tsatP(pMPa: number): number {
  if (pMPa < 611.212677e-6 || pMPa > P_KRITISCH) {
    throw new Error(
      `Druck ${pMPa.toFixed(6)} MPa außerhalb der Sättigungslinie (0,000611213-22,064 MPa).`,
    )
  }
  const beta = pMPa ** 0.25
  const E = beta * beta + N4[3] * beta + N4[6]
  const F = N4[1] * beta * beta + N4[4] * beta + N4[7]
  const G = N4[2] * beta * beta + N4[5] * beta + N4[8]
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G))
  return (N4[10] + D - Math.sqrt((N4[10] + D) ** 2 - 4 * (N4[9] + N4[10] * D))) / 2
}

export interface Saettigungszustand {
  T: number
  pMPa: number
  fluessig: Zustand
  dampf: Zustand
  /** Verdampfungsenthalpie r = h'' - h', J/kg */
  r: number
}

/**
 * Sattdampftafel bei gegebener Temperatur oder gegebenem Druck. Nur bis zur
 * Region-1/2/3-Grenze (T ≤ 623,15 K) implementiert - siehe Moduldoku.
 */
export function saettigung(bekannt: { T?: number; pMPa?: number }): Saettigungszustand {
  const T = bekannt.T ?? tsatP(bekannt.pMPa!)
  const pMPa = bekannt.pMPa ?? psatT(bekannt.T!)
  if (T > T_GRENZE_K) {
    throw new Error(
      `Sättigungstemperatur ${(T - 273.15).toFixed(2)} °C liegt über dem implementierten Bereich (bis 350 °C, Region 3 ist nicht implementiert).`,
    )
  }
  const fluessig = region1(T, pMPa)
  const dampf = region2(T, pMPa)
  return { T, pMPa, fluessig, dampf, r: dampf.h - fluessig.h }
}
