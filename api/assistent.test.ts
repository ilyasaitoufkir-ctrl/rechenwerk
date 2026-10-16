import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './assistent'

interface AufgezeichneteAntwort {
  status?: number
  json?: unknown
  writeHead?: [number, Record<string, string>]
  writes: string[]
  beendet: boolean
}

function fakeRes(): { res: VercelResponse; aufgezeichnet: AufgezeichneteAntwort } {
  const aufgezeichnet: AufgezeichneteAntwort = { writes: [], beendet: false }
  const res = {
    status(code: number) {
      aufgezeichnet.status = code
      return res
    },
    json(body: unknown) {
      aufgezeichnet.json = body
      return res
    },
    writeHead(code: number, headers: Record<string, string>) {
      aufgezeichnet.writeHead = [code, headers]
      return res
    },
    write(chunk: string) {
      aufgezeichnet.writes.push(chunk)
      return true
    },
    end() {
      aufgezeichnet.beendet = true
      return res
    },
  } as unknown as VercelResponse
  return { res, aufgezeichnet }
}

function fakeReq(partial: Partial<VercelRequest> & { method: string }): VercelRequest {
  return {
    headers: {},
    body: undefined,
    ...partial,
  } as unknown as VercelRequest
}

describe('api/assistent: Validierung lehnt ungültige Anfragen ab, ohne die Anthropic API zu kontaktieren', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    process.env.APP_ACCESS_TOKEN = 'richtiger-code'
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-dummy'
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.unstubAllGlobals()
  })

  it('lehnt alles außer POST mit 405 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    await handler(fakeReq({ method: 'GET' }), res)
    expect(aufgezeichnet.status).toBe(405)
  })

  it('lehnt eine zu große Anfrage per Content-Length mit 413 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    await handler(
      fakeReq({ method: 'POST', headers: { 'content-length': String(10_000_000) } }),
      res,
    )
    expect(aufgezeichnet.status).toBe(413)
  })

  it('lehnt einen fehlenden Zugangscode mit 401 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    await handler(fakeReq({ method: 'POST', headers: {}, body: { messages: [{ role: 'user', content: 'hi' }] } }), res)
    expect(aufgezeichnet.status).toBe(401)
  })

  it('lehnt einen falschen Zugangscode mit 401 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    await handler(
      fakeReq({
        method: 'POST',
        headers: { 'x-access-code': 'falscher-code' },
        body: { messages: [{ role: 'user', content: 'hi' }] },
      }),
      res,
    )
    expect(aufgezeichnet.status).toBe(401)
  })

  it('lehnt jeden Code mit 401 ab, wenn APP_ACCESS_TOKEN serverseitig gar nicht gesetzt ist (fail closed)', async () => {
    delete process.env.APP_ACCESS_TOKEN
    const { res, aufgezeichnet } = fakeRes()
    await handler(
      fakeReq({
        method: 'POST',
        headers: { 'x-access-code': 'irgendwas' },
        body: { messages: [{ role: 'user', content: 'hi' }] },
      }),
      res,
    )
    expect(aufgezeichnet.status).toBe(401)
  })

  it('liefert 500 mit einer sicheren Meldung, wenn kein ANTHROPIC_API_KEY konfiguriert ist (Code aber korrekt)', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const { res, aufgezeichnet } = fakeRes()
    await handler(
      fakeReq({
        method: 'POST',
        headers: { 'x-access-code': 'richtiger-code' },
        body: { messages: [{ role: 'user', content: 'hi' }] },
      }),
      res,
    )
    expect(aufgezeichnet.status).toBe(500)
    expect(JSON.stringify(aufgezeichnet.json)).not.toMatch(/sk-ant/)
  })

  it('lehnt eine leere "messages"-Liste mit 400 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    await handler(
      fakeReq({ method: 'POST', headers: { 'x-access-code': 'richtiger-code' }, body: { messages: [] } }),
      res,
    )
    expect(aufgezeichnet.status).toBe(400)
  })

  it('lehnt mehr als 100 Nachrichten mit 400 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    const messages = Array.from({ length: 101 }, () => ({ role: 'user', content: 'x' }))
    await handler(
      fakeReq({ method: 'POST', headers: { 'x-access-code': 'richtiger-code' }, body: { messages } }),
      res,
    )
    expect(aufgezeichnet.status).toBe(400)
  })

  it('lehnt ein ungültiges "tools"-Feld mit 400 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    await handler(
      fakeReq({
        method: 'POST',
        headers: { 'x-access-code': 'richtiger-code' },
        body: { messages: [{ role: 'user', content: 'hi' }], tools: 'kein-array' },
      }),
      res,
    )
    expect(aufgezeichnet.status).toBe(400)
  })

  it('lehnt ein zu großes Bild mit 400 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    const riesigesBild = 'a'.repeat(8_000_000)
    await handler(
      fakeReq({
        method: 'POST',
        headers: { 'x-access-code': 'richtiger-code' },
        body: {
          messages: [
            {
              role: 'user',
              content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: riesigesBild } }],
            },
          ],
        },
      }),
      res,
    )
    expect(aufgezeichnet.status).toBe(400)
  })

  it('lehnt zu viele Bilder in einer Anfrage mit 400 ab', async () => {
    const { res, aufgezeichnet } = fakeRes()
    const bildBlock = { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'abc' } }
    await handler(
      fakeReq({
        method: 'POST',
        headers: { 'x-access-code': 'richtiger-code' },
        body: { messages: [{ role: 'user', content: [bildBlock, bildBlock, bildBlock, bildBlock, bildBlock] }] },
      }),
      res,
    )
    expect(aufgezeichnet.status).toBe(400)
  })
})
