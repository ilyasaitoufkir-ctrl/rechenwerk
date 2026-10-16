import { describe, it, expect, vi, afterEach } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { fuehreGespraechsrundeAus, type KiRundenEreignis } from './ki-client'

function sseAntwort(message: Partial<Anthropic.Message>, status = 200): Response {
  const payload = { type: 'final', message }
  const body = `data: ${JSON.stringify(payload)}\n\n`
  return new Response(body, { status, headers: { 'Content-Type': 'text/event-stream' } })
}

function werkzeugaufrufNachricht(id: string): Partial<Anthropic.Message> {
  return {
    id: `msg_${id}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    content: [
      { type: 'tool_use', id: `toolu_${id}`, name: 'formeln_suchen', input: { query: 'reynolds' }, caller: { type: 'direct' } },
    ],
    stop_reason: 'tool_use',
    usage: { input_tokens: 10, output_tokens: 5 } as Anthropic.Usage,
  }
}

function endeNachricht(): Partial<Anthropic.Message> {
  return {
    id: 'msg_ende',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    content: [{ type: 'text', text: 'Fertig.', citations: [] }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 5 } as Anthropic.Usage,
  }
}

async function sammleEreignisse(
  verlauf: Anthropic.MessageParam[],
): Promise<KiRundenEreignis[]> {
  const ereignisse: KiRundenEreignis[] = []
  for await (const e of fuehreGespraechsrundeAus('testcode', verlauf)) {
    ereignisse.push(e)
  }
  return ereignisse
}

describe('fuehreGespraechsrundeAus: Werkzeug-Loop mit Begrenzung auf 8 Runden', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('bricht nach genau 8 Runden mit maxRundenErreicht ab, wenn der Assistent immer weiter Werkzeuge aufruft', async () => {
    let aufrufe = 0
    const fetchMock = vi.fn(async () => {
      aufrufe += 1
      return sseAntwort(werkzeugaufrufNachricht(String(aufrufe)))
    })
    vi.stubGlobal('fetch', fetchMock)

    const ereignisse = await sammleEreignisse([{ role: 'user', content: 'Was ist Reynolds?' }])

    expect(fetchMock).toHaveBeenCalledTimes(8)
    expect(ereignisse.at(-1)).toEqual({ typ: 'maxRundenErreicht' })
    expect(ereignisse.filter((e) => e.typ === 'werkzeugaufruf')).toHaveLength(8)
    expect(ereignisse.filter((e) => e.typ === 'werkzeugergebnis')).toHaveLength(8)
  })

  it('beendet die Schleife sofort bei end_turn, ohne alle 8 Runden zu verbrauchen', async () => {
    const fetchMock = vi.fn(async () => sseAntwort(endeNachricht()))
    vi.stubGlobal('fetch', fetchMock)

    const ereignisse = await sammleEreignisse([{ role: 'user', content: 'Was ist Reynolds?' }])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(ereignisse.some((e) => e.typ === 'text' && e.text === 'Fertig.')).toBe(false) // Text kommt nur über echte Deltas, nicht aus dem finalMessage-Block
    expect(ereignisse.some((e) => e.typ === 'verlauf')).toBe(true)
    expect(ereignisse.some((e) => e.typ === 'maxRundenErreicht')).toBe(false)
  })

  it('liefert einen fehler-Event bei HTTP 401, ohne zu werfen', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: 'nope' }), { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    const ereignisse = await sammleEreignisse([{ role: 'user', content: 'Test' }])
    expect(ereignisse).toHaveLength(1)
    expect(ereignisse[0]).toMatchObject({ typ: 'fehler' })
  })

  it('liefert einen fehler-Event, wenn fetch selbst wirft (Netzwerkfehler)', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('network down')
    })
    vi.stubGlobal('fetch', fetchMock)

    const ereignisse = await sammleEreignisse([{ role: 'user', content: 'Test' }])
    expect(ereignisse).toHaveLength(1)
    expect(ereignisse[0]).toMatchObject({ typ: 'fehler' })
  })

  it('erkennt Offline-Status, ohne fetch überhaupt aufzurufen', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('navigator', { onLine: false })

    const ereignisse = await sammleEreignisse([{ role: 'user', content: 'Test' }])
    expect(fetchMock).not.toHaveBeenCalled()
    expect(ereignisse[0]).toMatchObject({ typ: 'fehler' })
  })
})
