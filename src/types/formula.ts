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
  beispiel: Beispiel
}

export function variable(v: Variable): Variable {
  return v
}
