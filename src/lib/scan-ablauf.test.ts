import { describe, it, expect, vi, afterEach } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { erkenneMitFoto, fuehreGespraechsrundeAus } from './ki-client'
import { baueLoesenInstruktion, berechnungenAusVerlauf } from './scan'
import type { AufgabeErkennung } from './ki-werkzeuge'

function sseAntwort(message: Partial<Anthropic.Message>): Response {
  return new Response(`data: ${JSON.stringify({ type: 'final', message })}\n\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function assistentNachricht(content: Anthropic.ContentBlock[], stopReason: Anthropic.Message['stop_reason']): Partial<Anthropic.Message> {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    content,
    stop_reason: stopReason,
    usage: { input_tokens: 10, output_tokens: 5 } as Anthropic.Usage,
  }
}

describe('Scan-Ablauf: Erkennen -> Korrektur -> Lösen (gemockte API)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('Erkennen: fordert über tool_choice genau das Erkennungswerkzeug an und liefert dessen Input als Struktur', async () => {
    const erkanntesInput: AufgabeErkennung = {
      gegeben: [{ groesse: 'Innendurchmesser', wert: 70, einheit: 'mm', unsicher: true }],
      gesucht: ['Reynoldszahl'],
      annahmen: [],
    }

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(init!.body as string) as { tool_choice?: unknown; tools?: { name: string }[] }
      expect(body.tool_choice).toEqual({ type: 'tool', name: 'aufgabe_struktur_melden' })
      expect(body.tools).toHaveLength(1)
      return sseAntwort(
        assistentNachricht(
          [{ type: 'tool_use', id: 'toolu_1', name: 'aufgabe_struktur_melden', input: erkanntesInput, caller: { type: 'direct' } }],
          'tool_use',
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { daten, fehler } = await erkenneMitFoto<AufgabeErkennung>(
      'testcode',
      'aufgabe',
      [{ mediaType: 'image/jpeg', data: 'xxxx' }],
      'Lies die Aufgabe auf dem Foto.',
    )

    expect(fehler).toBeUndefined()
    expect(daten).toEqual(erkanntesInput)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('Korrektur + Lösen: der vom Nutzer korrigierte Wert - nicht der ursprünglich erkannte - fließt in die Instruktion und in die tatsächliche Berechnung ein', async () => {
    // Von der KI unsicher erkannt: Innendurchmesser 70 mm.
    const erkannt: AufgabeErkennung = {
      gegeben: [{ groesse: 'Innendurchmesser', wert: 70, einheit: 'mm', unsicher: true }],
      gesucht: ['Reynoldszahl'],
      annahmen: [],
    }
    // Nutzer korrigiert im Bestätigen-Schritt auf den tatsächlichen Wert, bevor gerechnet wird.
    const korrigiert: AufgabeErkennung = {
      ...erkannt,
      gegeben: [{ ...erkannt.gegeben[0], wert: 77, unsicher: false }],
    }

    const instruktion = baueLoesenInstruktion(korrigiert)
    expect(instruktion).toContain('Innendurchmesser = 77 mm')
    expect(instruktion).not.toContain('70 mm')

    let ersteAnfrageMessages: unknown
    let aufrufNummer = 0
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      aufrufNummer += 1
      const body = JSON.parse(init!.body as string) as { messages: unknown }
      if (aufrufNummer === 1) {
        ersteAnfrageMessages = body.messages
        // Claude ruft formel_berechnen mit dem (korrigierten) Durchmesser auf - exakt wie vom Client gesendet.
        return sseAntwort(
          assistentNachricht(
            [
              {
                type: 'tool_use',
                id: 'toolu_2',
                name: 'formel_berechnen',
                input: {
                  id: 'reynolds',
                  ziel: 'Re',
                  werte: { v: { wert: 2, einheit: 'ms' }, d: { wert: 77, einheit: 'mm' }, nu: { wert: 1, einheit: 'mm2s' } },
                },
                caller: { type: 'direct' },
              },
            ],
            'tool_use',
          ),
        )
      }
      return sseAntwort(assistentNachricht([{ type: 'text', text: 'Re ≈ 1 540 000, turbulente Strömung.', citations: [] }], 'end_turn'))
    })
    vi.stubGlobal('fetch', fetchMock)

    const loesungsVerlaeufe: Anthropic.MessageParam[][] = []
    for await (const ereignis of fuehreGespraechsrundeAus('testcode', [{ role: 'user', content: instruktion }])) {
      if (ereignis.typ === 'verlauf') loesungsVerlaeufe.push(ereignis.verlauf)
    }

    // Die an die API gesendete erste Nachricht enthält den korrigierten Wert, nicht den ursprünglich erkannten.
    const gesendeterText = (ersteAnfrageMessages as Anthropic.MessageParam[])[0].content as string
    expect(gesendeterText).toContain('77 mm')
    expect(gesendeterText).not.toContain('70 mm')

    // Das tatsächliche Berechnungsergebnis (vom echten Werkzeug, nicht gemockt) basiert auf 77 mm.
    const finalerVerlauf = loesungsVerlaeufe.at(-1)!
    const [berechnung] = berechnungenAusVerlauf(finalerVerlauf)
    expect(berechnung.bekanntSI.d).toBeCloseTo(0.077, 6)
    expect(berechnung.ergebnisSI.Re).toBeCloseTo((2 * 0.077) / 1e-6, 3)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
