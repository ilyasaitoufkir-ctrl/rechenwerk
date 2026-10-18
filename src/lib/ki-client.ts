/**
 * Client-seitige Orchestrierung des KI-Assistenten: ruft die dünne
 * Server-Funktion /api/assistent auf (reiner Proxy zur Anthropic Messages
 * API, kein Formelwissen) und führt den Werkzeugaufruf-Loop (max. 8 Runden)
 * selbst gegen die Formel-Registry aus - siehe src/lib/ki-werkzeuge.ts.
 *
 * Nur Typen aus @anthropic-ai/sdk werden importiert (import type - vom
 * Build vollständig entfernt, keine Laufzeitkosten im Browser-Bundle).
 */
import type Anthropic from '@anthropic-ai/sdk'
import { erzeugeWerkzeuge, fuehreWerkzeugAus, erzeugeErkennungsWerkzeug, type RechnerLink, type ScanModus } from './ki-werkzeuge'

const MAX_RUNDEN = 8

export interface KiNutzung {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export type KiRundenEreignis =
  | { typ: 'text'; text: string }
  | { typ: 'werkzeugaufruf'; id: string; name: string; input: Record<string, unknown> }
  | { typ: 'werkzeugergebnis'; id: string; name: string; ergebnis: unknown; istFehler: boolean; rechnerLink?: RechnerLink }
  | { typ: 'verlauf'; verlauf: Anthropic.MessageParam[] }
  | { typ: 'nutzung'; nutzung: KiNutzung }
  | { typ: 'fehler'; fehler: string }
  | { typ: 'maxRundenErreicht' }

interface SseEreignis {
  type?: string
  delta?: { type?: string; text?: string }
  message?: Anthropic.Message | string
}

async function* leseSseStream(response: Response): AsyncGenerator<SseEreignis> {
  const reader = response.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let puffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    puffer += decoder.decode(value, { stream: true })
    const teile = puffer.split('\n\n')
    puffer = teile.pop() ?? ''
    for (const teil of teile) {
      const zeile = teil.split('\n').find((l) => l.startsWith('data: '))
      if (!zeile) continue
      try {
        yield JSON.parse(zeile.slice(6)) as SseEreignis
      } catch {
        // unvollständiges Event ignorieren
      }
    }
  }
}

function istOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

interface RundenErgebnis {
  message?: Anthropic.Message
  fehler?: string
}

/** Async-Generator statt Funktion, damit Text-Deltas sofort weitergegeben werden (tippende UI) statt gepuffert zu werden. */
async function* einRunde(
  zugangscode: string,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
  signal?: AbortSignal,
): AsyncGenerator<string, RundenErgebnis> {
  if (istOffline()) {
    return { fehler: 'Keine Internetverbindung. Der Assistent benötigt eine Verbindung zum Server.' }
  }

  let response: Response
  try {
    response = await fetch('/api/assistent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Code': zugangscode },
      body: JSON.stringify({ messages, tools }),
      signal,
    })
  } catch {
    return { fehler: 'Verbindung zum Server fehlgeschlagen. Bitte Internetverbindung prüfen.' }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { fehler: 'Zugangscode fehlt oder ist falsch. Bitte in den Assistent-Einstellungen prüfen.' }
    }
    let text = 'Der Assistent ist aktuell nicht erreichbar.'
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) text = body.error
    } catch {
      // kein JSON-Fehlerkörper - Standardtext verwenden
    }
    return { fehler: text }
  }

  for await (const ereignis of leseSseStream(response)) {
    if (ereignis.type === 'content_block_delta' && ereignis.delta?.type === 'text_delta' && ereignis.delta.text) {
      yield ereignis.delta.text
    } else if (ereignis.type === 'final' && ereignis.message && typeof ereignis.message !== 'string') {
      return { message: ereignis.message }
    } else if (ereignis.type === 'error') {
      return { fehler: typeof ereignis.message === 'string' ? ereignis.message : 'Unbekannter Fehler beim Assistenten.' }
    }
  }
  return { fehler: 'Verbindung wurde unterbrochen, bevor eine Antwort vollständig war.' }
}

function istFehlerErgebnis(ergebnis: unknown): boolean {
  return typeof ergebnis === 'object' && ergebnis !== null && 'fehler' in (ergebnis as Record<string, unknown>)
}

/**
 * Führt eine vollständige Gesprächsrunde aus: schickt den Verlauf an die
 * API, liest die Antwort, führt bei Bedarf Werkzeuge gegen die Registry aus
 * und wiederholt das für bis zu 8 Runden, bis Claude keine weiteren
 * Werkzeugaufrufe mehr macht.
 */
export async function* fuehreGespraechsrundeAus(
  zugangscode: string,
  verlauf: Anthropic.MessageParam[],
  signal?: AbortSignal,
): AsyncGenerator<KiRundenEreignis> {
  const tools = erzeugeWerkzeuge() as unknown as Anthropic.Tool[]
  let messages = [...verlauf]

  for (let runde = 0; runde < MAX_RUNDEN; runde++) {
    const rundenGenerator = einRunde(zugangscode, messages, tools, signal)
    let ergebnis: RundenErgebnis = {}
    while (true) {
      const schritt = await rundenGenerator.next()
      if (schritt.done) {
        ergebnis = schritt.value
        break
      }
      yield { typ: 'text', text: schritt.value }
    }
    const { message, fehler } = ergebnis

    if (fehler) {
      yield { typ: 'fehler', fehler }
      return
    }
    if (!message) {
      yield { typ: 'fehler', fehler: 'Keine Antwort vom Assistenten erhalten.' }
      return
    }

    yield {
      typ: 'nutzung',
      nutzung: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
      },
    }

    messages = [...messages, { role: 'assistant', content: message.content }]
    yield { typ: 'verlauf', verlauf: messages }

    if (message.stop_reason !== 'tool_use') {
      return
    }

    const toolUseBlocks = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (toolUseBlocks.length === 0) return

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of toolUseBlocks) {
      const input = (block.input ?? {}) as Record<string, unknown>
      yield { typ: 'werkzeugaufruf', id: block.id, name: block.name, input }
      const werkzeugErgebnis = fuehreWerkzeugAus(block.name, input)
      const istFehler = istFehlerErgebnis(werkzeugErgebnis.fuerClaude)
      yield {
        typ: 'werkzeugergebnis',
        id: block.id,
        name: block.name,
        ergebnis: werkzeugErgebnis.fuerClaude,
        istFehler,
        rechnerLink: werkzeugErgebnis.rechnerLink,
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(werkzeugErgebnis.fuerClaude),
        is_error: istFehler,
      })
    }
    messages = [...messages, { role: 'user', content: toolResults }]
    yield { typ: 'verlauf', verlauf: messages }
  }

  yield { typ: 'maxRundenErreicht' }
}

export interface ErkennungErgebnis<T> {
  daten?: T
  fehler?: string
}

/**
 * Erkennen-Schritt des Scan-Features: ein einzelner, erzwungener Werkzeugaufruf (tool_choice),
 * der nur Rohdaten aus dem/den Foto(s) strukturiert zurückmeldet - keine Berechnung, kein
 * Rechenwerk-Wissen. Der Nutzer bestätigt/korrigiert das Ergebnis, bevor es irgendwo verwendet wird.
 */
export async function erkenneMitFoto<T>(
  zugangscode: string,
  modus: ScanModus,
  bilder: { mediaType: string; data: string }[],
  zusatzText: string,
  signal?: AbortSignal,
): Promise<ErkennungErgebnis<T>> {
  if (istOffline()) {
    return { fehler: 'Keine Internetverbindung. Zum Erkennen wird eine Verbindung zum Server benötigt.' }
  }

  const werkzeug = erzeugeErkennungsWerkzeug(modus)
  const inhalt: Anthropic.ContentBlockParam[] = bilder.map((b) => ({
    type: 'image',
    source: { type: 'base64', media_type: b.mediaType, data: b.data } as Anthropic.Base64ImageSource,
  }))
  if (zusatzText) inhalt.push({ type: 'text', text: zusatzText })
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: inhalt }]

  let response: Response
  try {
    response = await fetch('/api/assistent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Code': zugangscode },
      body: JSON.stringify({ messages, tools: [werkzeug], tool_choice: { type: 'tool', name: werkzeug.name } }),
      signal,
    })
  } catch {
    return { fehler: 'Verbindung zum Server fehlgeschlagen. Bitte Internetverbindung prüfen.' }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { fehler: 'Zugangscode fehlt oder ist falsch. Bitte in den Assistent-Einstellungen prüfen.' }
    }
    let text = 'Die Erkennung ist aktuell nicht erreichbar.'
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) text = body.error
    } catch {
      // kein JSON-Fehlerkörper - Standardtext verwenden
    }
    return { fehler: text }
  }

  for await (const ereignis of leseSseStream(response)) {
    if (ereignis.type === 'final' && ereignis.message && typeof ereignis.message !== 'string') {
      const toolBlock = ereignis.message.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      )
      if (!toolBlock) {
        return { fehler: 'Die Erkennung hat kein auswertbares Ergebnis geliefert.' }
      }
      return { daten: toolBlock.input as T }
    }
    if (ereignis.type === 'error') {
      return { fehler: typeof ereignis.message === 'string' ? ereignis.message : 'Unbekannter Fehler bei der Erkennung.' }
    }
  }
  return { fehler: 'Verbindung wurde unterbrochen, bevor ein Ergebnis vollständig war.' }
}
