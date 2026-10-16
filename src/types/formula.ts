import type { DimensionId } from '../units'

export interface Variable {
  /** Eindeutiger Schlüssel innerhalb der Formel, z. B. "V_dot" */
  id: string
  /** KaTeX-Symbol, z. B. "\\dot{V}" */
  symbol: string
  name: string
  dimension: DimensionId
  defaultUnit: string
  min?: number
  max?: number
  hinweis?: string
}

export interface Quelle {
  werk: string
  auflage?: string
  /** Kapitel oder Gleichungsnummer */
  kapitel?: string
  /** true, wenn Kapitel/Gleichungsnummer nicht sicher zugeordnet werden konnte */
  unsicher?: boolean
}

export interface Beispiel {
  /** Bekannte Größen in SI-Einheiten */
  bekannt: Record<string, number>
  ziel: string
  /** Erwartete Ergebnisse (SI) für ziel + zusatzAusgaben */
  erwartet: Record<string, number>
  toleranzRelativ?: number
}

export interface Formula {
  id: string
  name: string
  kategorie: string
  stichworte: string[]
  /** KaTeX-Quelltext der Formel */
  latex: string
  /** Alle Variablen, die in der Formel vorkommen (Eingaben, Ziele, Zusatzausgaben) */
  variablen: Variable[]
  /** Variablen-IDs, die als "unbekannt/zu berechnen" gewählt werden können */
  zielgroessen: string[]
  /** Variablen-IDs, die zusätzlich zur Zielgröße immer mitberechnet werden (z. B. Druckhöhe neben Δp) */
  zusatzAusgaben?: string[]
  /**
   * Reine Funktion in SI-Einheiten: bekannte Werte -> Zielgröße + Zusatzausgaben.
   * Darf bei ungültigen Eingaben (z. B. Division durch 0) eine Error werfen - der Rechner fängt das ab.
   */
  compute: (bekannt: Record<string, number>, ziel: string) => Record<string, number>
  gueltigkeit: string
  annahmen: string[]
  quelle: Quelle
  /** true, wenn die Formel auf Erfahrungswerten statt auf einer exakten Herleitung basiert */
  richtwert?: boolean
  /** Plausibilitätsprüfungen; gibt Warnhinweise zurück, blockiert aber nicht die Anzeige */
  warnungen?: (
    bekannt: Record<string, number>,
    ziel: string,
    ergebnis: Record<string, number>,
  ) => string[]
  /** Optionale ergänzende Empfehlung zum Ergebnis, z. B. Vorschlag einer Normnennweite */
  empfehlung?: (ergebnis: Record<string, number>) => string | undefined
  /** Optional: eine Variable wird als Schichtensumme statt als Einzelwert eingegeben */
  schichtfeld?: SchichtFeld
  /** Optional: mehrere Variablen werden aus einer Komponententabelle (z. B. Mischungskomponenten) berechnet */
  komponentenfeld?: KomponentenFeld
  beispiel: Beispiel
}

export function variable(v: Variable): Variable {
  return v
}

/**
 * Markiert eine Variable als "Summe aus mehreren Schichten" (z. B. Σ s_i/λ_i
 * einer mehrschichtigen Wand). Der Rechner zeigt dafür statt eines einzelnen
 * Eingabefelds eine Liste mit Dicke + Wärmeleitfähigkeit je Schicht
 * (beliebig viele, add/remove) und berechnet die Summe automatisch in SI.
 */
export interface SchichtFeld {
  /** Variablen-ID, deren Wert aus den Schichten berechnet wird */
  zielVariable: string
  dickeName: string
  leitfaehigkeitName: string
}

/**
 * Eine Spalte der Komponententabelle, z. B. "Masse" oder "Massenanteil".
 */
export interface KomponentenSpalte {
  id: string
  name: string
  dimension: DimensionId
  defaultUnit: string
}

/**
 * Eine aus der Komponententabelle berechnete Summenvariable: Σ (Produkt
 * der angegebenen Spalten je Zeile). Für eine Mischungsbilanz
 * w_Mix = Σ(m_i·w_i)/Σm_i braucht man z. B. zwei Summen: eine über die
 * Spalte "m" allein und eine über das Produkt "m·w".
 */
export interface KomponentenSumme {
  /** Variablen-ID, unter der die berechnete Summe in `bekannt` ankommt */
  zielVariable: string
  /** Spalten-IDs, deren Produkt je Zeile aufsummiert wird */
  spalten: string[]
}

/**
 * Markiert mehrere Variablen als aus einer Komponententabelle berechnet
 * (beliebig viele Zeilen, z. B. Mischungskomponenten). Der Rechner zeigt
 * dafür eine Tabelle mit den angegebenen Spalten (add/remove Zeilen) statt
 * einzelner Eingabefelder und berechnet die Summen automatisch in SI.
 */
export interface KomponentenFeld {
  spalten: KomponentenSpalte[]
  summen: KomponentenSumme[]
}
