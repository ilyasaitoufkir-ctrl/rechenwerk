import { useEffect, useRef, useState } from 'react'
import type Anthropic from '@anthropic-ai/sdk'
import { Send, Paperclip, X, Settings, History, Trash2, WifiOff, Plus } from 'lucide-react'
import { fuehreGespraechsrundeAus } from '../lib/ki-client'
import { ToolCallCard } from '../components/ToolCallCard'
import type { RechnerLink } from '../lib/ki-werkzeuge'
import {
  getKiZugangscode,
  getKiKonversationen,
  kiKonversationSpeichern,
  kiKonversationLoeschen,
  kiNutzungHinzufuegen,
  type KiKonversation,
} from '../lib/storage'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'

const MAX_BILD_PIXEL = 1600

interface LaufendesWerkzeug {
  id: string
  name: string
  input: Record<string, unknown>
  ergebnis?: unknown
  istFehler?: boolean
  rechnerLink?: RechnerLink
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
  useSetHeaderTitle('Assistent')
  const [zugangscode] = useState(getKiZugangscode)
  const [verlauf, setVerlauf] = useState<Anthropic.MessageParam[]>([])
  const [eingabe, setEingabe] = useState('')
  const [bildAnhang, setBildAnhang] = useState<{ mediaType: string; data: string } | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [laufendeWerkzeuge, setLaufendeWerkzeuge] = useState<LaufendesWerkzeug[]>([])
  const [fehler, setFehler] = useState<string | null>(null)
  const [zeigeVerlaufListe, setZeigeVerlaufListe] = useState(false)
  const [konversationen, setKonversationen] = useState<KiKonversation[]>(getKiKonversationen)
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
      navigiere({ name: 'einstellungen' })
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
          kiNutzungHinzufuegen(ereignis.nutzung)
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
    <div className="flex h-full flex-col gap-3 px-4 pt-2">
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setZeigeVerlaufListe((v) => !v)}
          aria-label="Unterhaltungen"
          className="rounded-lg p-2 text-stone-500"
        >
          <History size={20} />
        </button>
        <button onClick={neueUnterhaltung} aria-label="Neue Unterhaltung" className="rounded-lg p-2 text-stone-500">
          <Plus size={20} />
        </button>
        <button
          onClick={() => navigiere({ name: 'einstellungen' })}
          aria-label="Einstellungen"
          className="rounded-lg p-2 text-stone-500"
        >
          <Settings size={20} />
        </button>
      </div>

      {zeigeVerlaufListe && (
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-paper-200 p-2">
          {konversationen.length === 0 && <p className="p-2 text-sm text-stone-500">Noch keine gespeicherten Unterhaltungen.</p>}
          {konversationen.map((k) => (
            <div key={k.id} className="flex items-center gap-1">
              <button onClick={() => konversationLaden(k)} className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm text-stone-700">
                {k.titel}
              </button>
              <button
                onClick={() => setKonversationen(kiKonversationLoeschen(k.id))}
                aria-label="Unterhaltung löschen"
                className="shrink-0 rounded-lg p-1.5 text-stone-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!zugangscode && (
        <button
          onClick={() => navigiere({ name: 'einstellungen' })}
          className="rounded-2xl bg-amber-50 p-3 text-left text-[14px] text-amber-900"
        >
          Noch kein Zugangscode hinterlegt. Zum Einrichten antippen (Einstellungen → KI-Assistent).
        </button>
      )}

      {!online && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 p-2.5 text-sm text-amber-900">
          <WifiOff size={16} />
          Keine Internetverbindung - der Assistent benötigt eine Verbindung zum Server.
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {verlauf.length === 0 && !streamingText && (
          <p className="py-10 text-center text-sm text-stone-500">
            Frag etwas aus der Verfahrenstechnik - der Assistent rechnet ausschließlich über die geprüfte
            Formelbibliothek von Rechenwerk und nennt dabei immer Formel, Quelle und Status.
          </p>
        )}

        {verlauf.map((m, i) => {
          if (typeof m.content === 'string') {
            return (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl bg-accent-600 px-3.5 py-2.5 text-[16px] text-ink'
                    : 'max-w-[85%] whitespace-pre-wrap text-[16px] text-stone-900'
                }
              >
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
                      className={
                        m.role === 'user'
                          ? 'ml-auto max-w-[85%] rounded-2xl bg-accent-600 px-3.5 py-2.5 text-[16px] text-ink'
                          : 'max-w-[85%] whitespace-pre-wrap text-[16px] text-stone-900'
                      }
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
          <div className="max-w-[85%] whitespace-pre-wrap text-[16px] text-stone-900">{streamingText}</div>
        )}

        {laeuft && !streamingText && laufendeWerkzeuge.length === 0 && (
          <div className="flex gap-1 px-3 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.3s]" />
          </div>
        )}

        {fehler && (
          <div className="rounded-2xl bg-red-50 p-2.5 text-sm text-red-800">
            {fehler}
          </div>
        )}
        <div ref={scrollEndeRef} />
      </div>

      {bildAnhang && (
        <div className="flex items-center gap-2 rounded-2xl bg-paper-200 p-2">
          <img src={`data:${bildAnhang.mediaType};base64,${bildAnhang.data}`} alt="Vorschau" className="h-10 w-10 rounded-lg object-cover" />
          <span className="flex-1 text-xs text-stone-500">Bild angehängt</span>
          <button onClick={() => setBildAnhang(null)} aria-label="Bild entfernen" className="rounded-lg p-1.5 text-stone-400 hover:bg-paper-100">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 pb-[calc(12px+var(--safe-bottom))]">
        <label className="shrink-0 cursor-pointer rounded-lg p-2.5 text-stone-500">
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
          className="min-w-0 flex-1 resize-none rounded-xl border border-paper-300 bg-paper-200 px-3 py-2.5 text-[16px]"
        />
        <button
          onClick={() => void senden()}
          disabled={laeuft || (!eingabe.trim() && !bildAnhang)}
          aria-label="Senden"
          className="shrink-0 rounded-lg bg-accent-600 p-2.5 text-ink disabled:opacity-40"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
