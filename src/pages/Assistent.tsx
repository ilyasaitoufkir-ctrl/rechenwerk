import { useEffect, useRef, useState } from 'react'
import type Anthropic from '@anthropic-ai/sdk'
import { Send, Paperclip, X, Settings, History, Trash2, WifiOff, Plus } from 'lucide-react'
import { fuehreGespraechsrundeAus, type KiNutzung as KiRundenNutzung } from '../lib/ki-client'
import { ToolCallCard } from '../components/ToolCallCard'
import type { RechnerLink } from '../lib/ki-werkzeuge'
import {
  getKiZugangscode,
  setKiZugangscode,
  getKiKonversationen,
  kiKonversationSpeichern,
  kiKonversationLoeschen,
  getKiNutzung,
  kiNutzungHinzufuegen,
  type KiKonversation,
} from '../lib/storage'

const MAX_BILD_PIXEL = 1600

interface LaufendesWerkzeug {
  id: string
  name: string
  input: Record<string, unknown>
  ergebnis?: unknown
  istFehler?: boolean
  rechnerLink?: RechnerLink
}

// Sonnet-5-Preise laut Anthropic-Preisliste (Stand Implementierung) - nur für eine grobe,
// lokale Kostenschätzung. Keine Garantie auf Aktualität, siehe Hinweistext in der UI.
const PREIS_PRO_MTOK = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }

function geschaetzteKostenEuro(n: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }): number {
  return (
    (n.inputTokens / 1e6) * PREIS_PRO_MTOK.input +
    (n.outputTokens / 1e6) * PREIS_PRO_MTOK.output +
    (n.cacheReadTokens / 1e6) * PREIS_PRO_MTOK.cacheRead +
    (n.cacheWriteTokens / 1e6) * PREIS_PRO_MTOK.cacheWrite
  )
}

function extrahiereTitel(nachrichten: Anthropic.MessageParam[]): string {
  const erste = nachrichten.find((m) => m.role === 'user')
  if (!erste) return 'Unterhaltung'
  if (typeof erste.content === 'string') return erste.content.trim().slice(0, 60) || 'Unterhaltung'
  const textBlock = erste.content.find((b) => b.type === 'text')
  const text = textBlock && 'text' in textBlock ? textBlock.text : ''
  return text.trim().slice(0, 60) || 'Unterhaltung (Bild)'
}

/** Verkleinert ein Bild clientseitig auf max. 1600px Kantenlänge, bevor es als Base64 verschickt wird. */
async function bildVerarbeiten(file: File): Promise<{ mediaType: string; data: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'))
    reader.readAsDataURL(file)
  })

  const bild = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'))
    img.src = dataUrl
  })

  const skala = Math.min(1, MAX_BILD_PIXEL / Math.max(bild.width, bild.height))
  const breite = Math.round(bild.width * skala)
  const hoehe = Math.round(bild.height * skala)

  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bildverarbeitung nicht verfügbar.')
  ctx.drawImage(bild, 0, 0, breite, hoehe)

  const verkleinert = canvas.toDataURL('image/jpeg', 0.85)
  const data = verkleinert.slice(verkleinert.indexOf(',') + 1)
  return { mediaType: 'image/jpeg', data }
}

export function Assistent() {
  const [zugangscode, setZugangscodeState] = useState(getKiZugangscode)
  const [codeEingabe, setCodeEingabe] = useState('')
  const [verlauf, setVerlauf] = useState<Anthropic.MessageParam[]>([])
  const [eingabe, setEingabe] = useState('')
  const [bildAnhang, setBildAnhang] = useState<{ mediaType: string; data: string } | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [laufendeWerkzeuge, setLaufendeWerkzeuge] = useState<LaufendesWerkzeug[]>([])
  const [fehler, setFehler] = useState<string | null>(null)
  const [zeigeEinstellungen, setZeigeEinstellungen] = useState(false)
  const [zeigeVerlaufListe, setZeigeVerlaufListe] = useState(false)
  const [konversationen, setKonversationen] = useState<KiKonversation[]>(getKiKonversationen)
  const [nutzung, setNutzung] = useState(getKiNutzung)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [rechnerLinks, setRechnerLinks] = useState<Record<string, RechnerLink>>({})

  const konversationIdRef = useRef<string>(crypto.randomUUID())
  const abortRef = useRef<AbortController | null>(null)
  const scrollEndeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const aufOnline = () => setOnline(true)
    const aufOffline = () => setOnline(false)
    window.addEventListener('online', aufOnline)
    window.addEventListener('offline', aufOffline)
    return () => {
      window.removeEventListener('online', aufOnline)
      window.removeEventListener('offline', aufOffline)
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    scrollEndeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [verlauf, streamingText, laufendeWerkzeuge])

  function neueUnterhaltung(): void {
    abortRef.current?.abort()
    konversationIdRef.current = crypto.randomUUID()
    setVerlauf([])
    setStreamingText('')
    setLaufendeWerkzeuge([])
    setFehler(null)
    setZeigeVerlaufListe(false)
  }

  function konversationLaden(k: KiKonversation): void {
    abortRef.current?.abort()
    konversationIdRef.current = k.id
    setVerlauf(k.nachrichten)
    setStreamingText('')
    setLaufendeWerkzeuge([])
    setFehler(null)
    setZeigeVerlaufListe(false)
  }

  async function senden(): Promise<void> {
    const text = eingabe.trim()
    if (!text && !bildAnhang) return
    if (!zugangscode) {
      setZeigeEinstellungen(true)
      return
    }

    const inhalt: Anthropic.ContentBlockParam[] = []
    if (bildAnhang) {
      inhalt.push({ type: 'image', source: { type: 'base64', media_type: bildAnhang.mediaType, data: bildAnhang.data } as Anthropic.Base64ImageSource })
    }
    if (text) inhalt.push({ type: 'text', text })

    let aktuellerVerlauf: Anthropic.MessageParam[] = [...verlauf, { role: 'user', content: inhalt }]
    setVerlauf(aktuellerVerlauf)
    setEingabe('')
    setBildAnhang(null)
    setFehler(null)
    setStreamingText('')
    setLaufendeWerkzeuge([])
    setLaeuft(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      for await (const ereignis of fuehreGespraechsrundeAus(zugangscode, aktuellerVerlauf, controller.signal)) {
        if (ereignis.typ === 'text') {
          setStreamingText((t) => t + ereignis.text)
        } else if (ereignis.typ === 'werkzeugaufruf') {
          setLaufendeWerkzeuge((w) => [...w, { id: ereignis.id, name: ereignis.name, input: ereignis.input }])
        } else if (ereignis.typ === 'werkzeugergebnis') {
          setLaufendeWerkzeuge((w) =>
            w.map((e) =>
              e.id === ereignis.id
                ? { ...e, ergebnis: ereignis.ergebnis, istFehler: ereignis.istFehler, rechnerLink: ereignis.rechnerLink }
                : e,
            ),
          )
          if (ereignis.rechnerLink) {
            const link = ereignis.rechnerLink
            setRechnerLinks((r) => ({ ...r, [ereignis.id]: link }))
          }
        } else if (ereignis.typ === 'nutzung') {
          const n: KiRundenNutzung = ereignis.nutzung
          setNutzung(kiNutzungHinzufuegen(n))
        } else if (ereignis.typ === 'verlauf') {
          aktuellerVerlauf = ereignis.verlauf
          setVerlauf(aktuellerVerlauf)
          setStreamingText('')
          setLaufendeWerkzeuge([])
          const gespeichert: KiKonversation = {
            id: konversationIdRef.current,
            titel: extrahiereTitel(aktuellerVerlauf),
            erstelltAm: Date.now(),
            aktualisiertAm: Date.now(),
            nachrichten: aktuellerVerlauf,
          }
          setKonversationen(kiKonversationSpeichern(gespeichert))
        } else if (ereignis.typ === 'fehler') {
          setFehler(ereignis.fehler)
        } else if (ereignis.typ === 'maxRundenErreicht') {
          setFehler('Der Assistent hat zu viele Werkzeugaufrufe in Folge gebraucht, ohne fertig zu werden. Bitte die Frage konkretisieren.')
        }
      }
    } finally {
      setLaeuft(false)
      abortRef.current = null
    }
  }

  async function aufBildAuswahl(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setBildAnhang(await bildVerarbeiten(file))
    } catch {
      setFehler('Bild konnte nicht verarbeitet werden.')
    }
  }

  const toolResultsById = new Map<string, { content: string; istFehler: boolean }>()
  for (const m of verlauf) {
    if (m.role !== 'user' || typeof m.content === 'string') continue
    for (const block of m.content) {
      if (block.type === 'tool_result') {
        const inhalt = typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
        toolResultsById.set(block.tool_use_id, { content: inhalt, istFehler: Boolean(block.is_error) })
      }
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Assistent</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZeigeVerlaufListe((v) => !v)}
            aria-label="Unterhaltungen"
            className="rounded-lg p-2 text-stone-500 hover:bg-paper-100 dark:text-stone-400 dark:hover:bg-white/10"
          >
            <History size={20} />
          </button>
          <button
            onClick={neueUnterhaltung}
            aria-label="Neue Unterhaltung"
            className="rounded-lg p-2 text-stone-500 hover:bg-paper-100 dark:text-stone-400 dark:hover:bg-white/10"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => setZeigeEinstellungen((v) => !v)}
            aria-label="Einstellungen"
            className="rounded-lg p-2 text-stone-500 hover:bg-paper-100 dark:text-stone-400 dark:hover:bg-white/10"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {zeigeVerlaufListe && (
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-xl border border-paper-300 bg-white p-2 dark:border-white/10 dark:bg-white/5">
          {konversationen.length === 0 && (
            <p className="p-2 text-sm text-stone-500 dark:text-stone-400">Noch keine gespeicherten Unterhaltungen.</p>
          )}
          {konversationen.map((k) => (
            <div key={k.id} className="flex items-center gap-1">
              <button onClick={() => konversationLaden(k)} className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm text-stone-700 hover:bg-paper-100 dark:text-stone-300 dark:hover:bg-white/10">
                {k.titel}
              </button>
              <button
                onClick={() => setKonversationen(kiKonversationLoeschen(k.id))}
                aria-label="Unterhaltung löschen"
                className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-paper-100 dark:hover:bg-white/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {zeigeEinstellungen && (
        <div className="flex flex-col gap-3 rounded-xl border border-paper-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-400">Zugangscode</label>
            <div className="flex gap-2">
              <input
                value={codeEingabe}
                onChange={(e) => setCodeEingabe(e.target.value)}
                placeholder={zugangscode ? '•••• bereits gespeichert' : 'Zugangscode eingeben'}
                className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
              />
              <button
                onClick={() => {
                  setKiZugangscode(codeEingabe)
                  setZugangscodeState(getKiZugangscode())
                  setCodeEingabe('')
                }}
                className="shrink-0 rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
              >
                Speichern
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Dies ist dein persönlicher Zugangscode für den Assistenten - nicht der API-Schlüssel. Der bleibt
              ausschließlich serverseitig in Vercel hinterlegt.
            </p>
          </div>

          <div className="border-t border-paper-200 pt-2 dark:border-white/10">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">Geschätzte Kosten (lokal, ungefähr)</p>
            <p className="text-stone-700 dark:text-stone-300">
              {nutzung.anfragen} Anfragen · ca. {geschaetzteKostenEuro(nutzung).toFixed(3)} €
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Grobe Schätzung anhand der Token-Nutzung zu Sonnet-5-Listenpreisen, keine echte Abrechnung.
            </p>
          </div>
        </div>
      )}

      {!online && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200">
          <WifiOff size={16} />
          Keine Internetverbindung - der Assistent benötigt eine Verbindung zum Server.
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {verlauf.length === 0 && !streamingText && (
          <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
            Frag etwas aus der Verfahrenstechnik - der Assistent rechnet ausschließlich über die geprüfte
            Formelbibliothek von Rechenwerk und nennt dabei immer Formel, Quelle und Status.
          </p>
        )}

        {verlauf.map((m, i) => {
          if (typeof m.content === 'string') {
            return (
              <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'ml-auto bg-accent-600 text-white' : 'bg-paper-100 text-stone-800 dark:bg-white/10 dark:text-stone-200'}`}>
                {m.content}
              </div>
            )
          }
          return (
            <div key={i} className="flex flex-col gap-2">
              {m.content.map((block, j) => {
                if (block.type === 'text' && block.text) {
                  return (
                    <div
                      key={j}
                      className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                        m.role === 'user' ? 'ml-auto bg-accent-600 text-white' : 'bg-paper-100 text-stone-800 dark:bg-white/10 dark:text-stone-200'
                      }`}
                    >
                      {block.text}
                    </div>
                  )
                }
                if (block.type === 'image') {
                  return (
                    <div key={j} className="ml-auto max-w-[60%] rounded-xl overflow-hidden">
                      {'data' in block.source && (
                        <img src={`data:${block.source.media_type};base64,${block.source.data}`} alt="Angehängtes Bild" />
                      )}
                    </div>
                  )
                }
                if (block.type === 'tool_use') {
                  const ergebnisEintrag = toolResultsById.get(block.id)
                  if (!ergebnisEintrag) return null
                  let ergebnis: unknown
                  try {
                    ergebnis = JSON.parse(ergebnisEintrag.content)
                  } catch {
                    ergebnis = ergebnisEintrag.content
                  }
                  return (
                    <ToolCallCard
                      key={j}
                      name={block.name}
                      input={(block.input ?? {}) as Record<string, unknown>}
                      ergebnis={ergebnis}
                      istFehler={ergebnisEintrag.istFehler}
                      rechnerLink={rechnerLinks[block.id]}
                    />
                  )
                }
                return null
              })}
            </div>
          )
        })}

        {laufendeWerkzeuge.map((w) => (
          <ToolCallCard
            key={w.id}
            name={w.name}
            input={w.input}
            ergebnis={w.ergebnis ?? { fehler: 'Wird ausgeführt...' }}
            istFehler={w.istFehler ?? false}
            rechnerLink={w.rechnerLink}
          />
        ))}

        {streamingText && (
          <div className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-paper-100 px-3 py-2 text-sm text-stone-800 dark:bg-white/10 dark:text-stone-200">
            {streamingText}
          </div>
        )}

        {laeuft && !streamingText && laufendeWerkzeuge.length === 0 && (
          <div className="flex gap-1 px-3 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.3s]" />
          </div>
        )}

        {fehler && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
            {fehler}
          </div>
        )}
        <div ref={scrollEndeRef} />
      </div>

      {bildAnhang && (
        <div className="flex items-center gap-2 rounded-xl border border-paper-300 bg-white p-2 dark:border-white/10 dark:bg-white/5">
          <img src={`data:${bildAnhang.mediaType};base64,${bildAnhang.data}`} alt="Vorschau" className="h-10 w-10 rounded-lg object-cover" />
          <span className="flex-1 text-xs text-stone-500 dark:text-stone-400">Bild angehängt</span>
          <button onClick={() => setBildAnhang(null)} aria-label="Bild entfernen" className="rounded-lg p-1.5 text-stone-400 hover:bg-paper-100 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <label className="shrink-0 cursor-pointer rounded-lg p-2.5 text-stone-500 hover:bg-paper-100 dark:text-stone-400 dark:hover:bg-white/10">
          <Paperclip size={20} />
          <input type="file" accept="image/*" className="hidden" onChange={aufBildAuswahl} />
        </label>
        <textarea
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void senden()
            }
          }}
          placeholder="Frage an den Assistenten..."
          rows={1}
          className="min-w-0 flex-1 resize-none rounded-xl border border-paper-300 bg-white px-3 py-2.5 text-sm dark:border-white/15 dark:bg-white/5"
        />
        <button
          onClick={() => void senden()}
          disabled={laeuft || (!eingabe.trim() && !bildAnhang)}
          aria-label="Senden"
          className="shrink-0 rounded-lg bg-accent-600 p-2.5 text-white hover:bg-accent-700 disabled:opacity-40"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
