import { useEffect, useRef, useState } from 'react'
import type Anthropic from '@anthropic-ai/sdk'
import {
  Camera,
  X,
  WifiOff,
  Plus,
  Trash2,
  Printer,
  FolderPlus,
  History as HistoryIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import { bildVerarbeiten, type VerarbeitetesBild } from '../lib/bildverarbeitung'
import { erkenneMitFoto, fuehreGespraechsrundeAus } from '../lib/ki-client'
import type {
  AufgabeErkennung,
  MessprotokollErkennung,
  MessprotokollReihe,
  RechnerLink,
  ScanModus,
  TypenschildErkennung,
} from '../lib/ki-werkzeuge'
import { berechnungenAusVerlauf, baueLoesenInstruktion, fehlerAusVerlauf, letzterAssistentText, type BerechnungAusLoesung } from '../lib/scan'
import { fromSI } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { fotoSpeichern } from '../lib/idb'
import { ToolCallCard } from '../components/ToolCallCard'
import { SegmentedControl } from '../components/SegmentedControl'
import { BottomSheet } from '../components/BottomSheet'
import {
  getKiZugangscode,
  verlaufEintragHinzufuegen,
  getProjekte,
  projektAnlegen,
  projektBerechnungHinzufuegen,
  projektNotizHinzufuegen,
  projektFotoHinzufuegen,
  statistikUebernahmeAblegen,
  kiNutzungHinzufuegen,
  setLetzteEingaben,
} from '../lib/storage'

const MAX_FOTOS = 4

const MODUS_OPTIONEN: { value: ScanModus; label: string }[] = [
  { value: 'aufgabe', label: 'Aufgabe' },
  { value: 'typenschild', label: 'Typenschild' },
  { value: 'messprotokoll', label: 'Messprotokoll' },
]

function leereAufgabe(): AufgabeErkennung {
  return { gegeben: [], gesucht: [], annahmen: [] }
}

function ProjektSpeichernSheet({
  offen,
  onClose,
  berechnungen,
  notizText,
  fotos,
}: {
  offen: boolean
  onClose: () => void
  berechnungen: BerechnungAusLoesung[]
  notizText: string
  fotos: VerarbeitetesBild[]
}) {
  const [projekte, setProjekte] = useState(getProjekte)
  const [neuerName, setNeuerName] = useState('')
  const [gespeichertIn, setGespeichertIn] = useState<string | null>(null)

  async function speichernIn(projektId: string): Promise<void> {
    const jetzt = Date.now()
    for (const b of berechnungen) {
      projektBerechnungHinzufuegen(projektId, {
        formelId: b.formel.id,
        formelName: b.formel.name,
        kategorie: b.formel.kategorie,
        bekannt: b.bekanntSI,
        ziel: b.ziel,
        ergebnis: b.ergebnisSI,
        quelle: b.quelle,
        verifiziert: b.verifiziert,
        richtwert: b.richtwert,
        zeitpunkt: jetzt,
      })
    }
    if (notizText.trim()) projektNotizHinzufuegen(projektId, notizText.trim())
    for (const foto of fotos) {
      const id = crypto.randomUUID()
      await fotoSpeichern({ id, dataUrl: foto.dataUrl, projektId, kontext: 'scan', erstelltAm: jetzt })
      projektFotoHinzufuegen(projektId, id)
    }
    setGespeichertIn(projektId)
    setTimeout(() => {
      setGespeichertIn(null)
      onClose()
    }, 800)
  }

  async function neuesProjektUndSpeichern(): Promise<void> {
    if (!neuerName.trim()) return
    const projekt = projektAnlegen(neuerName.trim(), '')
    setProjekte(getProjekte())
    setNeuerName('')
    await speichernIn(projekt.id)
  }

  return (
    <BottomSheet offen={offen} onClose={onClose} titel="In Projekt speichern">
      <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
        {projekte.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {projekte.map((p) => (
              <button
                key={p.id}
                onClick={() => void speichernIn(p.id)}
                className="flex items-center justify-between gap-2 rounded-xl bg-paper-200 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] text-stone-900">{p.name}</span>
                {gespeichertIn === p.id && <CheckCircle2 size={16} className="shrink-0 text-sage-600" />}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-paper-300 pt-3">
          <FolderPlus size={18} className="shrink-0 text-stone-400" />
          <input
            value={neuerName}
            onChange={(e) => setNeuerName(e.target.value)}
            placeholder="Neues Projekt..."
            className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
          />
          <button
            onClick={() => void neuesProjektUndSpeichern()}
            disabled={!neuerName.trim()}
            className="shrink-0 rounded-lg bg-accent-600 p-2 text-ink disabled:opacity-50"
            aria-label="Neues Projekt anlegen und speichern"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

export function Scan() {
  useSetHeaderTitle('Aufgabe scannen')
  const [zugangscode] = useState(getKiZugangscode)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [modus, setModus] = useState<ScanModus>('aufgabe')
  const [fotos, setFotos] = useState<VerarbeitetesBild[]>([])
  const [schritt, setSchritt] = useState<'aufnahme' | 'bestaetigen' | 'loesung'>('aufnahme')
  const [erkennenLaeuft, setErkennenLaeuft] = useState(false)
  const [erkennenFehler, setErkennenFehler] = useState<string | null>(null)

  const [aufgabe, setAufgabe] = useState<AufgabeErkennung>(leereAufgabe)
  const [neuesGesucht, setNeuesGesucht] = useState('')
  const [typenschild, setTypenschild] = useState<Record<string, string>>({})
  const [typenschildUnsicher, setTypenschildUnsicher] = useState<string[]>([])
  const [reihen, setReihen] = useState<(MessprotokollReihe & { werteText: string })[]>([])

  const [loesungVerlauf, setLoesungVerlauf] = useState<Anthropic.MessageParam[]>([])
  const [loesungStreamingText, setLoesungStreamingText] = useState('')
  const [loesungLaeuft, setLoesungLaeuft] = useState(false)
  const [loesungFehler, setLoesungFehler] = useState<string | null>(null)
  const [detailsOffen, setDetailsOffen] = useState(false)
  const [projektSheetOffen, setProjektSheetOffen] = useState(false)
  const [imVerlaufGespeichert, setImVerlaufGespeichert] = useState(false)
  const [rechnerLinks, setRechnerLinks] = useState<Record<string, RechnerLink>>({})

  const abortRef = useRef<AbortController | null>(null)

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

  async function fotosHinzufuegen(dateien: FileList | null): Promise<void> {
    if (!dateien) return
    const liste = Array.from(dateien).slice(0, MAX_FOTOS - fotos.length)
    const verarbeitet: VerarbeitetesBild[] = []
    for (const datei of liste) {
      try {
        verarbeitet.push(await bildVerarbeiten(datei))
      } catch {
        setErkennenFehler('Ein Foto konnte nicht verarbeitet werden.')
      }
    }
    setFotos((f) => [...f, ...verarbeitet].slice(0, MAX_FOTOS))
  }

  function fotoEntfernen(i: number): void {
    setFotos((f) => f.filter((_, idx) => idx !== i))
  }

  function alleZuruecksetzen(): void {
    abortRef.current?.abort()
    setFotos([])
    setSchritt('aufnahme')
    setErkennenFehler(null)
    setAufgabe(leereAufgabe())
    setTypenschild({})
    setTypenschildUnsicher([])
    setReihen([])
    setLoesungVerlauf([])
    setLoesungStreamingText('')
    setLoesungFehler(null)
    setImVerlaufGespeichert(false)
    setRechnerLinks({})
  }

  async function erkennenStarten(): Promise<void> {
    if (!zugangscode) {
      navigiere({ name: 'einstellungen' })
      return
    }
    if (fotos.length === 0) return
    setErkennenLaeuft(true)
    setErkennenFehler(null)
    const controller = new AbortController()
    abortRef.current = controller
    const bilder = fotos.map((f) => ({ mediaType: f.mediaType, data: f.data }))

    try {
      if (modus === 'aufgabe') {
        const { daten, fehler } = await erkenneMitFoto<AufgabeErkennung>(
          zugangscode,
          'aufgabe',
          bilder,
          'Lies die verfahrenstechnische Aufgabe auf dem/den Foto(s) und melde die Struktur über das Werkzeug.',
          controller.signal,
        )
        if (fehler || !daten) {
          setErkennenFehler(fehler ?? 'Erkennung fehlgeschlagen.')
          return
        }
        setAufgabe({
          gegeben: daten.gegeben ?? [],
          gesucht: daten.gesucht ?? [],
          annahmen: daten.annahmen ?? [],
        })
        setSchritt('bestaetigen')
      } else if (modus === 'typenschild') {
        const { daten, fehler } = await erkenneMitFoto<TypenschildErkennung>(
          zugangscode,
          'typenschild',
          bilder,
          'Lies das Pumpen- oder Motortypenschild auf dem Foto und melde die Werte über das Werkzeug.',
          controller.signal,
        )
        if (fehler || !daten) {
          setErkennenFehler(fehler ?? 'Erkennung fehlgeschlagen.')
          return
        }
        setTypenschild({
          leistungKw: daten.leistungKw !== undefined ? String(daten.leistungKw) : '',
          drehzahlUpm: daten.drehzahlUpm !== undefined ? String(daten.drehzahlUpm) : '',
          foerderhoeheM: daten.foerderhoeheM !== undefined ? String(daten.foerderhoeheM) : '',
          volumenstromM3h: daten.volumenstromM3h !== undefined ? String(daten.volumenstromM3h) : '',
          spannungV: daten.spannungV !== undefined ? String(daten.spannungV) : '',
        })
        setTypenschildUnsicher(daten.unsicher ?? [])
        setSchritt('bestaetigen')
      } else {
        const { daten, fehler } = await erkenneMitFoto<MessprotokollErkennung>(
          zugangscode,
          'messprotokoll',
          bilder,
          'Lies die handschriftlichen Messwerte auf dem Messprotokoll-Foto und melde sie über das Werkzeug.',
          controller.signal,
        )
        if (fehler || !daten) {
          setErkennenFehler(fehler ?? 'Erkennung fehlgeschlagen.')
          return
        }
        setReihen((daten.reihen ?? []).map((r) => ({ ...r, werteText: r.werte.join(', ') })))
        setSchritt('bestaetigen')
      }
    } finally {
      setErkennenLaeuft(false)
      abortRef.current = null
    }
  }

  async function loesenStarten(): Promise<void> {
    if (!zugangscode) {
      navigiere({ name: 'einstellungen' })
      return
    }
    setSchritt('loesung')
    setLoesungVerlauf([])
    setLoesungStreamingText('')
    setLoesungFehler(null)
    setLoesungLaeuft(true)
    setImVerlaufGespeichert(false)

    const controller = new AbortController()
    abortRef.current = controller
    let aktuellerVerlauf: Anthropic.MessageParam[] = [{ role: 'user', content: baueLoesenInstruktion(aufgabe) }]
    setLoesungVerlauf(aktuellerVerlauf)

    try {
      for await (const ereignis of fuehreGespraechsrundeAus(zugangscode, aktuellerVerlauf, controller.signal)) {
        if (ereignis.typ === 'text') {
          setLoesungStreamingText((t) => t + ereignis.text)
        } else if (ereignis.typ === 'werkzeugergebnis' && ereignis.rechnerLink) {
          const link = ereignis.rechnerLink
          setRechnerLinks((r) => ({ ...r, [ereignis.id]: link }))
        } else if (ereignis.typ === 'nutzung') {
          kiNutzungHinzufuegen(ereignis.nutzung)
        } else if (ereignis.typ === 'verlauf') {
          aktuellerVerlauf = ereignis.verlauf
          setLoesungVerlauf(aktuellerVerlauf)
          setLoesungStreamingText('')
        } else if (ereignis.typ === 'fehler') {
          setLoesungFehler(ereignis.fehler)
        } else if (ereignis.typ === 'maxRundenErreicht') {
          setLoesungFehler('Zu viele Werkzeugaufrufe in Folge ohne Ergebnis. Teile der Aufgabe sind möglicherweise nicht lösbar.')
        }
      }
    } finally {
      setLoesungLaeuft(false)
      abortRef.current = null
    }
  }

  function typenschildUebernehmen(): void {
    const vDot = parseDecimal(typenschild.volumenstromM3h ?? '')
    const h = parseDecimal(typenschild.foerderhoeheM ?? '')
    if (vDot === null && h === null) {
      setErkennenFehler('Für eine Übernahme in den Pumpenrechner werden Förderhöhe und/oder Volumenstrom benötigt.')
      return
    }
    const werte: Record<string, string> = {}
    const einheiten: Record<string, string> = {}
    if (vDot !== null) {
      werte.V_dot = String(vDot)
      einheiten.V_dot = 'm3h'
    }
    if (h !== null) {
      werte.H = String(h)
      einheiten.H = 'm'
    }
    setLetzteEingaben('pumpenleistung', { ziel: 'Pel', werte, einheiten })
    navigiere({ name: 'formel', id: 'pumpenleistung' })
  }

  function reiheUebernehmen(reihe: MessprotokollReihe & { werteText: string }): void {
    const werte = reihe.werteText
      .split(',')
      .map((t) => parseDecimal(t.trim()))
      .filter((w): w is number => w !== null)
    if (werte.length === 0) return
    statistikUebernahmeAblegen(werte)
    navigiere({ name: 'statistik' })
  }

  function imVerlaufSpeichern(): void {
    const berechnungen = berechnungenAusVerlauf(loesungVerlauf)
    for (const b of berechnungen) {
      verlaufEintragHinzufuegen({
        formelId: b.formel.id,
        formelName: b.formel.name,
        bekannt: b.bekanntSI,
        ziel: b.ziel,
        ergebnis: b.ergebnisSI,
      })
    }
    setImVerlaufGespeichert(true)
  }

  const berechnungen = berechnungenAusVerlauf(loesungVerlauf)
  const nichtLoesbar = fehlerAusVerlauf(loesungVerlauf)
  const antwortText = letzterAssistentText(loesungVerlauf) || loesungStreamingText
  const notizText = [
    aufgabe.gegeben.length > 0
      ? `Gegeben: ${aufgabe.gegeben.map((g) => `${g.groesse} = ${g.wert} ${g.einheit}`).join('; ')}`
      : null,
    aufgabe.gesucht.length > 0 ? `Gesucht: ${aufgabe.gesucht.join(', ')}` : null,
    antwortText ? `Antwort: ${antwortText}` : null,
  ]
    .filter((z): z is string => Boolean(z))
    .join('\n')

  const toolResultsById = new Map<string, { content: string; istFehler: boolean }>()
  for (const m of loesungVerlauf) {
    if (m.role !== 'user' || typeof m.content === 'string') continue
    for (const block of m.content) {
      if (block.type === 'tool_result') {
        const inhalt = typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
        toolResultsById.set(block.tool_use_id, { content: inhalt, istFehler: Boolean(block.is_error) })
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
      {!zugangscode && (
        <button
          onClick={() => navigiere({ name: 'einstellungen' })}
          className="no-print rounded-2xl bg-amber-50 p-3 text-left text-[14px] text-amber-900"
        >
          Noch kein Zugangscode hinterlegt. Zum Einrichten antippen (Einstellungen → KI-Assistent). Der Rest der App bleibt ohne Zugangscode nutzbar.
        </button>
      )}
      {!online && (
        <div className="no-print flex items-center gap-2 rounded-2xl bg-amber-50 p-2.5 text-sm text-amber-900">
          <WifiOff size={16} />
          Keine Internetverbindung - das Scannen benötigt eine Verbindung zum Server. Der Rest der App bleibt nutzbar.
        </div>
      )}

      {schritt === 'aufnahme' && (
        <div className="flex flex-col gap-4">
          <SegmentedControl value={modus} onChange={setModus} optionen={MODUS_OPTIONEN} />

          <div className="flex flex-wrap gap-2">
            {fotos.map((f, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl">
                <img src={f.dataUrl} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => fotoEntfernen(i)}
                  aria-label="Foto entfernen"
                  className="absolute right-1 top-1 rounded-full bg-paper-50/90 p-1 text-stone-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {fotos.length < MAX_FOTOS && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-paper-300 text-stone-500">
                <Camera size={22} />
                <span className="text-[11px]">Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void fotosHinzufuegen(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>

          {erkennenFehler && <p className="rounded-xl bg-red-50 p-2.5 text-sm text-red-800">{erkennenFehler}</p>}

          <button
            onClick={() => void erkennenStarten()}
            disabled={fotos.length === 0 || erkennenLaeuft || !zugangscode || !online}
            className="rounded-xl bg-accent-600 py-3 text-center text-[16px] font-medium text-ink disabled:opacity-40"
          >
            {erkennenLaeuft ? 'Erkenne...' : 'Erkennen'}
          </button>
        </div>
      )}

      {schritt === 'bestaetigen' && modus === 'aufgabe' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow px-1">Gegeben</span>
            {aufgabe.gegeben.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-xl bg-paper-200 p-2">
                <input
                  value={g.groesse}
                  onChange={(e) =>
                    setAufgabe((a) => ({
                      ...a,
                      gegeben: a.gegeben.map((x, idx) => (idx === i ? { ...x, groesse: e.target.value } : x)),
                    }))
                  }
                  placeholder="Größe"
                  className="min-w-0 flex-[2] rounded-lg border border-paper-300 bg-paper-50 px-2 py-1.5 text-[14px]"
                />
                <input
                  value={String(g.wert)}
                  inputMode="decimal"
                  onChange={(e) =>
                    setAufgabe((a) => ({
                      ...a,
                      gegeben: a.gegeben.map((x, idx) =>
                        idx === i ? { ...x, wert: parseDecimal(e.target.value) ?? 0 } : x,
                      ),
                    }))
                  }
                  placeholder="Wert"
                  className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-2 py-1.5 text-[14px]"
                />
                <input
                  value={g.einheit}
                  onChange={(e) =>
                    setAufgabe((a) => ({
                      ...a,
                      gegeben: a.gegeben.map((x, idx) => (idx === i ? { ...x, einheit: e.target.value } : x)),
                    }))
                  }
                  placeholder="Einheit"
                  className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-2 py-1.5 text-[14px]"
                />
                <button
                  onClick={() =>
                    setAufgabe((a) => ({
                      ...a,
                      gegeben: a.gegeben.map((x, idx) => (idx === i ? { ...x, unsicher: !x.unsicher } : x)),
                    }))
                  }
                  aria-label="Als unsicher markieren"
                  className={`shrink-0 rounded-lg p-1.5 ${g.unsicher ? 'bg-amber-100 text-amber-800' : 'text-stone-400'}`}
                >
                  <AlertTriangle size={15} />
                </button>
                <button
                  onClick={() => setAufgabe((a) => ({ ...a, gegeben: a.gegeben.filter((_, idx) => idx !== i) }))}
                  aria-label="Zeile löschen"
                  className="shrink-0 rounded-lg p-1.5 text-stone-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setAufgabe((a) => ({ ...a, gegeben: [...a.gegeben, { groesse: '', wert: 0, einheit: '', unsicher: false }] }))
              }
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-paper-300 py-2 text-[13px] text-stone-500"
            >
              <Plus size={15} /> Größe hinzufügen
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="eyebrow px-1">Gesucht</span>
            <div className="flex flex-wrap gap-1.5">
              {aufgabe.gesucht.map((g, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-paper-200 px-3 py-1.5 text-[13px] text-stone-700">
                  {g}
                  <button
                    onClick={() => setAufgabe((a) => ({ ...a, gesucht: a.gesucht.filter((_, idx) => idx !== i) }))}
                    aria-label="Entfernen"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={neuesGesucht}
                onChange={(e) => setNeuesGesucht(e.target.value)}
                placeholder="Gesuchte Größe..."
                className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[15px]"
              />
              <button
                onClick={() => {
                  if (!neuesGesucht.trim()) return
                  setAufgabe((a) => ({ ...a, gesucht: [...a.gesucht, neuesGesucht.trim()] }))
                  setNeuesGesucht('')
                }}
                className="shrink-0 rounded-lg bg-paper-200 p-2 text-stone-600"
                aria-label="Hinzufügen"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {aufgabe.annahmen.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow px-1">Annahmen (von der KI erkannt)</span>
              <ul className="flex flex-col gap-1 rounded-xl bg-paper-200 p-3 text-[13px] text-stone-600">
                {aufgabe.annahmen.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[12px] text-stone-500">
            Bitte prüfe jede Zeile. Unsicher erkannte Werte sind markiert. Erst nach Bestätigung wird gerechnet.
          </p>

          <div className="flex gap-2">
            <button onClick={alleZuruecksetzen} className="flex-1 rounded-xl bg-paper-200 py-3 text-center text-[15px] text-stone-600">
              Neu aufnehmen
            </button>
            <button
              onClick={() => void loesenStarten()}
              disabled={aufgabe.gegeben.length === 0 || aufgabe.gesucht.length === 0}
              className="flex-[2] rounded-xl bg-accent-600 py-3 text-center text-[16px] font-medium text-ink disabled:opacity-40"
            >
              Bestätigen und lösen
            </button>
          </div>
        </div>
      )}

      {schritt === 'bestaetigen' && modus === 'typenschild' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {[
              { id: 'leistungKw', label: 'Leistung (kW)' },
              { id: 'drehzahlUpm', label: 'Drehzahl (1/min)' },
              { id: 'foerderhoeheM', label: 'Förderhöhe (m)' },
              { id: 'volumenstromM3h', label: 'Volumenstrom (m³/h)' },
              { id: 'spannungV', label: 'Spannung (V)' },
            ].map((f) => (
              <div key={f.id} className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-stone-700">
                  {f.label}
                  {typenschildUnsicher.includes(f.id) && <AlertTriangle size={13} className="text-amber-600" />}
                </label>
                <input
                  value={typenschild[f.id] ?? ''}
                  inputMode="decimal"
                  onChange={(e) => setTypenschild((t) => ({ ...t, [f.id]: e.target.value }))}
                  className="rounded-xl border border-paper-300 bg-paper-200 px-3 py-2.5 text-[16px]"
                />
              </div>
            ))}
          </div>
          <p className="text-[12px] text-stone-500">Bitte Werte prüfen. Unsicher erkannte Felder sind markiert.</p>
          <div className="flex gap-2">
            <button onClick={alleZuruecksetzen} className="flex-1 rounded-xl bg-paper-200 py-3 text-center text-[15px] text-stone-600">
              Neu aufnehmen
            </button>
            <button
              onClick={typenschildUebernehmen}
              className="flex-[2] rounded-xl bg-accent-600 py-3 text-center text-[16px] font-medium text-ink"
            >
              In Pumpenrechner übernehmen
            </button>
          </div>
        </div>
      )}

      {schritt === 'bestaetigen' && modus === 'messprotokoll' && (
        <div className="flex flex-col gap-4">
          {reihen.length === 0 && <p className="text-[14px] text-stone-500">Keine Messreihe erkannt.</p>}
          {reihen.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-paper-200 p-3">
              <div className="flex gap-2">
                <input
                  value={r.groesse}
                  onChange={(e) => setReihen((rs) => rs.map((x, idx) => (idx === i ? { ...x, groesse: e.target.value } : x)))}
                  placeholder="Größe"
                  className="min-w-0 flex-[2] rounded-lg border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-[14px]"
                />
                <input
                  value={r.einheit}
                  onChange={(e) => setReihen((rs) => rs.map((x, idx) => (idx === i ? { ...x, einheit: e.target.value } : x)))}
                  placeholder="Einheit"
                  className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-[14px]"
                />
                {r.unsicher && <AlertTriangle size={16} className="mt-2 shrink-0 text-amber-600" />}
              </div>
              <textarea
                value={r.werteText}
                onChange={(e) => setReihen((rs) => rs.map((x, idx) => (idx === i ? { ...x, werteText: e.target.value } : x)))}
                placeholder="Werte, durch Komma getrennt"
                rows={2}
                className="w-full resize-none rounded-lg border border-paper-300 bg-paper-50 px-2.5 py-2 text-[14px]"
              />
              <button
                onClick={() => reiheUebernehmen(r)}
                className="self-start rounded-lg bg-accent-600 px-3 py-1.5 text-[13px] font-medium text-ink"
              >
                In Statistik übernehmen
              </button>
            </div>
          ))}
          <button onClick={alleZuruecksetzen} className="rounded-xl bg-paper-200 py-3 text-center text-[15px] text-stone-600">
            Neu aufnehmen
          </button>
        </div>
      )}

      {schritt === 'loesung' && (
        <div className="druckbericht flex flex-col gap-4">
          <div className="no-print flex items-center justify-between">
            <span className="eyebrow">Klausurlösung</span>
            <button onClick={alleZuruecksetzen} className="text-[13px] font-medium text-stone-500">
              Neue Aufgabe
            </button>
          </div>

          <section className="flex flex-col gap-1 rounded-xl bg-paper-200 p-3">
            <p className="text-[13px] font-semibold text-stone-700">Gegeben</p>
            {aufgabe.gegeben.map((g, i) => (
              <p key={i} className="text-[13px] text-stone-600">
                {g.groesse} = {g.wert} {g.einheit}
              </p>
            ))}
          </section>
          <section className="flex flex-col gap-1 rounded-xl bg-paper-200 p-3">
            <p className="text-[13px] font-semibold text-stone-700">Gesucht</p>
            <p className="text-[13px] text-stone-600">{aufgabe.gesucht.join(', ')}</p>
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-stone-700">Lösungsweg</p>
            {berechnungen.length === 0 && !loesungLaeuft && (
              <p className="text-[13px] text-stone-500">Noch keine Formel berechnet.</p>
            )}
            {berechnungen.map((b, i) => {
              const zielVar = b.formel.variablen.find((v) => v.id === b.ziel)!
              const eingaben = Object.entries(b.bekanntSI)
                .map(([id, wertSI]) => {
                  const v = b.formel.variablen.find((x) => x.id === id)
                  if (!v) return null
                  return `${v.name} = ${formatNumber(fromSI(wertSI, v.dimension, v.defaultUnit), 4)} ${v.defaultUnit}`
                })
                .filter(Boolean)
                .join(', ')
              return (
                <div key={i} className="flex flex-col gap-1 rounded-xl bg-paper-200 p-3">
                  <p className="text-[14px] font-medium text-stone-900">{b.formel.name}</p>
                  <p className="text-[13px] text-stone-600">{eingaben}</p>
                  <p className="text-[14px] font-medium text-accent-600">
                    {zielVar.name} = {formatNumber(fromSI(b.ergebnisSI[b.ziel], zielVar.dimension, zielVar.defaultUnit), 4)}{' '}
                    {zielVar.defaultUnit}
                  </p>
                  <p className="text-[12px] text-stone-500">
                    Quelle: {b.quelle.werk}
                    {b.quelle.unsicher ? ' (unsicher)' : ''} · {b.verifiziert ? 'verifiziert' : 'unverifiziert'}
                    {b.richtwert ? ', Richtwert' : ''}
                  </p>
                </div>
              )
            })}
          </section>

          {nichtLoesbar.length > 0 && (
            <section className="flex flex-col gap-1 rounded-xl bg-amber-50 p-3">
              <p className="text-[13px] font-semibold text-amber-900">Nicht lösbare Teile</p>
              {nichtLoesbar.map((f, i) => (
                <p key={i} className="text-[13px] text-amber-900">
                  {f}
                </p>
              ))}
            </section>
          )}

          {antwortText && (
            <section className="flex flex-col gap-1">
              <p className="text-[13px] font-semibold text-stone-700">Ergebnis</p>
              <p className="whitespace-pre-wrap text-[14px] text-stone-800">{antwortText}</p>
            </section>
          )}

          {loesungLaeuft && (
            <div className="no-print flex gap-1 px-1 py-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.3s]" />
            </div>
          )}
          {loesungFehler && <p className="no-print rounded-xl bg-red-50 p-2.5 text-sm text-red-800">{loesungFehler}</p>}

          <button onClick={() => setDetailsOffen((o) => !o)} className="no-print self-start text-[13px] font-medium text-stone-500">
            {detailsOffen ? 'Werkzeugaufrufe ausblenden' : 'Werkzeugaufrufe anzeigen'}
          </button>
          {detailsOffen && (
            <div className="no-print flex flex-col gap-2">
              {loesungVerlauf.map((m, i) => {
                if (typeof m.content === 'string') return null
                return m.content.map((block, j) => {
                  if (block.type !== 'tool_use') return null
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
                      key={`${i}-${j}`}
                      name={block.name}
                      input={(block.input ?? {}) as Record<string, unknown>}
                      ergebnis={ergebnis}
                      istFehler={ergebnisEintrag.istFehler}
                      rechnerLink={rechnerLinks[block.id]}
                    />
                  )
                })
              })}
            </div>
          )}

          {!loesungLaeuft && (berechnungen.length > 0 || antwortText) && (
            <div className="no-print flex flex-wrap gap-2 pt-2">
              <button
                onClick={imVerlaufSpeichern}
                disabled={berechnungen.length === 0 || imVerlaufGespeichert}
                className="flex items-center gap-1.5 rounded-xl bg-paper-200 px-3.5 py-2.5 text-[13px] font-medium text-stone-700 disabled:opacity-50"
              >
                {imVerlaufGespeichert ? <CheckCircle2 size={15} /> : <HistoryIcon size={15} />}
                Im Verlauf speichern
              </button>
              <button
                onClick={() => setProjektSheetOffen(true)}
                disabled={berechnungen.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-paper-200 px-3.5 py-2.5 text-[13px] font-medium text-stone-700 disabled:opacity-50"
              >
                <FolderPlus size={15} />
                In Projekt speichern
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-paper-200 px-3.5 py-2.5 text-[13px] font-medium text-stone-700"
              >
                <Printer size={15} />
                Als PDF / drucken
              </button>
            </div>
          )}
        </div>
      )}

      <ProjektSpeichernSheet
        offen={projektSheetOffen}
        onClose={() => setProjektSheetOffen(false)}
        berechnungen={berechnungen}
        notizText={notizText}
        fotos={fotos}
      />
    </div>
  )
}
