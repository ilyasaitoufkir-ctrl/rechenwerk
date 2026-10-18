/**
 * Reine Hilfsfunktionen für das Scan-Feature (src/pages/Scan.tsx) - bewusst ohne React,
 * damit der Ablauf Erkennen -> Korrektur -> Lösen ohne Komponenten-Rendering testbar ist.
 */
import type Anthropic from '@anthropic-ai/sdk'
import { getFormel } from '../formulas/registry'
import { getVerifizierung } from './storage'
import { toSI } from '../units'
import type { Formula, Quelle } from '../types/formula'
import type { AufgabeErkennung } from './ki-werkzeuge'

export interface BerechnungAusLoesung {
  formel: Formula
  ziel: string
  bekanntSI: Record<string, number>
  ergebnisSI: Record<string, number>
  quelle: Quelle
  verifiziert: boolean
  richtwert: boolean
}

/** Liest aus dem Lösen-Verlauf alle erfolgreichen formel_berechnen-Aufrufe heraus - fürs Speichern und den Klausurlösungs-Bericht. */
export function berechnungenAusVerlauf(verlauf: Anthropic.MessageParam[]): BerechnungAusLoesung[] {
  const toolResultsById = new Map<string, unknown>()
  for (const m of verlauf) {
    if (m.role !== 'user' || typeof m.content === 'string') continue
    for (const block of m.content) {
      if (block.type === 'tool_result' && !block.is_error) {
        try {
          toolResultsById.set(block.tool_use_id, typeof block.content === 'string' ? JSON.parse(block.content) : block.content)
        } catch {
          // kein auswertbares JSON - Treffer bleibt aus
        }
      }
    }
  }

  const ausgabe: BerechnungAusLoesung[] = []
  for (const m of verlauf) {
    if (m.role !== 'assistant' || typeof m.content === 'string') continue
    for (const block of m.content) {
      if (block.type !== 'tool_use' || block.name !== 'formel_berechnen') continue
      const ergebnis = toolResultsById.get(block.id) as { ergebnisse?: { id: string; wertSI: number }[] } | undefined
      const input = block.input as { id?: string; ziel?: string; werte?: Record<string, { wert?: number; einheit?: string }> }
      const formel = input.id ? getFormel(input.id) : undefined
      if (!ergebnis?.ergebnisse || !formel || !input.ziel) continue

      const bekanntSI: Record<string, number> = {}
      for (const [varId, eingabe] of Object.entries(input.werte ?? {})) {
        const variable = formel.variablen.find((v) => v.id === varId)
        if (!variable || typeof eingabe.wert !== 'number') continue
        try {
          bekanntSI[varId] = toSI(eingabe.wert, variable.dimension, eingabe.einheit ?? variable.defaultUnit)
        } catch {
          // ungültige Einheit - Variable bleibt aus bekanntSI
        }
      }
      const ergebnisSI: Record<string, number> = {}
      for (const e of ergebnis.ergebnisse) ergebnisSI[e.id] = e.wertSI

      ausgabe.push({
        formel,
        ziel: input.ziel,
        bekanntSI,
        ergebnisSI,
        quelle: formel.quelle,
        verifiziert: getVerifizierung(formel.id)?.verifiziert ?? false,
        richtwert: formel.richtwert ?? false,
      })
    }
  }
  return ausgabe
}

/** Sammelt die Fehlermeldungen aller fehlgeschlagenen Werkzeugaufrufe - für "nicht lösbare Teile" im Bericht. */
export function fehlerAusVerlauf(verlauf: Anthropic.MessageParam[]): string[] {
  const fehler: string[] = []
  for (const m of verlauf) {
    if (m.role !== 'user' || typeof m.content === 'string') continue
    for (const block of m.content) {
      if (block.type === 'tool_result' && block.is_error) {
        const inhalt = typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
        try {
          const parsed = JSON.parse(inhalt) as { fehler?: string }
          fehler.push(parsed.fehler ?? inhalt)
        } catch {
          fehler.push(inhalt)
        }
      }
    }
  }
  return fehler
}

/** Letzter freier Antworttext des Assistenten im Lösen-Verlauf. */
export function letzterAssistentText(verlauf: Anthropic.MessageParam[]): string {
  for (let i = verlauf.length - 1; i >= 0; i--) {
    const m = verlauf[i]
    if (m.role !== 'assistant') continue
    if (typeof m.content === 'string') return m.content
    const texte = m.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text)
    if (texte.length > 0) return texte.join('\n\n')
  }
  return ''
}

/**
 * Baut die Instruktion für den Lösen-Schritt aus der (vom Nutzer bestätigten/korrigierten!)
 * Aufgabenstruktur. Wird NICHT mit den ursprünglich erkannten Rohdaten aufgerufen, sondern mit
 * dem Stand nach der Korrektur im Bestätigen-Schritt - so fließen korrigierte Werte tatsächlich
 * in die Berechnung ein, nie die unkorrigierten.
 */
export function baueLoesenInstruktion(aufgabe: AufgabeErkennung): string {
  const zeilen: string[] = []
  zeilen.push(
    'Löse folgende verfahrenstechnische Aufgabe ausschließlich mit den vorhandenen Werkzeugen ' +
      '(formeln_suchen, formel_details, formel_berechnen, einheit_umrechnen, stoffdaten_abfragen). ' +
      'Stelle die Lösung wie eine Klausurlösung dar: Gegeben, Gesucht, Lösungsweg mit Formeln und ' +
      'eingesetzten Werten, Ergebnis mit Einheit, und nenne für jede verwendete Formel Quelle und ' +
      'Verifizierungsstatus. Erfinde niemals eine Zahl - wenn ein Teil mit den vorhandenen Formeln ' +
      'nicht lösbar ist, benenne das ausdrücklich als nicht lösbar statt zu schätzen.',
  )
  zeilen.push('')
  zeilen.push('Gegeben:')
  for (const g of aufgabe.gegeben) {
    zeilen.push(`- ${g.groesse} = ${g.wert} ${g.einheit}${g.unsicher ? ' (unsicher gelesen)' : ''}`)
  }
  zeilen.push('')
  zeilen.push(`Gesucht: ${aufgabe.gesucht.join(', ')}`)
  if (aufgabe.annahmen.length > 0) {
    zeilen.push('')
    zeilen.push(`Annahmen: ${aufgabe.annahmen.join('; ')}`)
  }
  return zeilen.join('\n')
}
