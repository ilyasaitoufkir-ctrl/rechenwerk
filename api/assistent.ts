/**
 * Dünner Server-Proxy zur Anthropic Messages API für den KI-Assistenten.
 * Enthält bewusst KEINE Formellogik - die Werkzeugdefinitionen kommen vom
 * Client (generiert aus der Formel-Registry, siehe src/lib/ki-werkzeuge.ts)
 * und werden hier nur durchgereicht; die Werkzeuge selbst werden ebenfalls
 * client-seitig ausgeführt (max. 8 Runden, siehe src/lib/ki-client.ts).
 *
 * Diese Datei importiert absichtlich den DRUCKGERAETE_HINWEIS aus der
 * bestehenden Formel-Bibliothek (nicht dupliziert) - sonst keine
 * Formel-Imports.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { DRUCKGERAETE_HINWEIS } from '../src/formulas/druckgeraete/hinweis'
import { createHash, timingSafeEqual } from 'node:crypto'

const MAX_BODY_BYTES = 6_000_000
const MAX_MESSAGES = 100
const MAX_BILDER_PRO_ANFRAGE = 4
const MAX_BILD_BASE64_ZEICHEN = 7_000_000 // ~5 MB Rohdaten
const MAX_TOOLS = 20
const MAX_TOKENS = 4096

const SYSTEM_PROMPT = `Du bist der KI-Assistent von Rechenwerk, einer Verfahrenstechnik-Rechenwerk-App.
Du beantwortest technische Fragen auf Deutsch, knapp und klar, ohne Gedankenstriche oder
Bindestrich-Aufzählungen im Fließtext.

Feste Regeln:
1. Du rechnest niemals selbst. Jede Zahl in deiner Antwort muss aus einem Werkzeugaufruf
   (formel_berechnen oder einheit_umrechnen) stammen. Erfinde niemals ein Ergebnis und
   schätze keine Zahlen im Kopf.
2. Wenn du ein Ergebnis aus formel_berechnen nennst, nenne immer auch den Formelnamen, die
   Quelle (quelle.werk, ggf. mit Hinweis auf unsichere Kapitelangabe) und den
   Verifizierungsstatus (verifiziert oder unverifiziert, bzw. Richtwert).
3. Für allgemeine Fachfragen ohne Zahlenwert darfst du aus deinem eigenen Fachwissen
   antworten, aber sage ehrlich, wenn etwas nicht durch eine geprüfte Formel in Rechenwerk
   abgedeckt ist, statt eine Zahl zu konstruieren.
4. Wenn dir für eine Berechnung Werte fehlen, frage gezielt danach, anstatt Werte
   anzunehmen oder Standardwerte zu erfinden.
5. Wenn eine Formel aus der Kategorie "Druckgeräte" betroffen ist, wiederhole sinngemäß
   diesen Pflichthinweis: "${DRUCKGERAETE_HINWEIS}"
6. Erfinde niemals eine Quelle, ein Kapitel oder eine Gleichungsnummer. Nutzt eine Formel
   quelle.unsicher, sage das offen dazu.
7. Nutze formeln_suchen und formel_details, bevor du formel_berechnen aufrufst, damit du
   die richtigen Variablen-IDs und Einheiten verwendest.`

function sendeJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body)
}

function zugangscodeGueltig(header: unknown, erwartet: string | undefined): boolean {
  if (!erwartet) return false
  if (typeof header !== 'string' || header.length === 0) return false
  const a = createHash('sha256').update(header).digest()
  const b = createHash('sha256').update(erwartet).digest()
  return timingSafeEqual(a, b)
}

function zaehleBilderUndPruefeGroesse(messages: unknown[]): { anzahl: number; zuGross: boolean } {
  let anzahl = 0
  let zuGross = false
  for (const m of messages) {
    const content = (m as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const block of content) {
      const b = block as { type?: string; source?: { data?: string } }
      if (b.type === 'image') {
        anzahl += 1
        if (typeof b.source?.data === 'string' && b.source.data.length > MAX_BILD_BASE64_ZEICHEN) {
          zuGross = true
        }
      }
    }
  }
  return { anzahl, zuGross }
}

function sicherheitsFehlermeldung(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return 'Der Server ist nicht richtig konfiguriert (ungültiger API-Schlüssel). Bitte den Administrator informieren.'
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return 'Der KI-Dienst hat die Anfrage abgelehnt (keine Berechtigung).'
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'Der KI-Dienst ist aktuell überlastet. Bitte in Kürze erneut versuchen.'
  }
  if (err instanceof Anthropic.BadRequestError) {
    return 'Die Anfrage an den KI-Dienst war ungültig. Bitte die Unterhaltung neu starten.'
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return 'Verbindung zum KI-Dienst fehlgeschlagen. Bitte Internetverbindung prüfen.'
  }
  if (err instanceof Anthropic.APIError) {
    return 'Der KI-Dienst ist aktuell nicht erreichbar. Bitte später erneut versuchen.'
  }
  return 'Unbekannter Fehler beim KI-Dienst.'
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendeJson(res, 405, { error: 'Nur POST erlaubt.' })
    return
  }

  const contentLength = Number(req.headers['content-length'] ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    sendeJson(res, 413, { error: 'Anfrage zu groß.' })
    return
  }

  const erwarteterCode = process.env.APP_ACCESS_TOKEN
  if (!zugangscodeGueltig(req.headers['x-access-code'], erwarteterCode)) {
    sendeJson(res, 401, { error: 'Ungültiger oder fehlender Zugangscode.' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    sendeJson(res, 500, { error: 'Der Server ist nicht richtig konfiguriert (kein API-Schlüssel hinterlegt).' })
    return
  }

  const body = req.body as { messages?: unknown; tools?: unknown } | undefined
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    sendeJson(res, 400, { error: 'Feld "messages" fehlt oder ist leer.' })
    return
  }
  if (body.messages.length > MAX_MESSAGES) {
    sendeJson(res, 400, { error: `Unterhaltung zu lang (maximal ${MAX_MESSAGES} Nachrichten pro Anfrage).` })
    return
  }
  if (body.tools !== undefined && (!Array.isArray(body.tools) || body.tools.length > MAX_TOOLS)) {
    sendeJson(res, 400, { error: 'Feld "tools" ist ungültig.' })
    return
  }

  const { anzahl: bilderAnzahl, zuGross } = zaehleBilderUndPruefeGroesse(body.messages)
  if (zuGross) {
    sendeJson(res, 400, { error: 'Ein angehängtes Bild ist zu groß.' })
    return
  }
  if (bilderAnzahl > MAX_BILDER_PRO_ANFRAGE) {
    sendeJson(res, 400, { error: `Zu viele Bilder in einer Anfrage (maximal ${MAX_BILDER_PRO_ANFRAGE}).` })
    return
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
  const client = new Anthropic()

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const sendeEvent = (payload: unknown): void => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      tools: body.tools as Anthropic.Tool[],
      messages: body.messages as Anthropic.MessageParam[],
    })

    stream.on('streamEvent', (event) => {
      sendeEvent(event)
    })

    const finalMessage = await stream.finalMessage()
    sendeEvent({ type: 'final', message: finalMessage })
  } catch (err) {
    sendeEvent({ type: 'error', message: sicherheitsFehlermeldung(err) })
  } finally {
    res.end()
  }
}
