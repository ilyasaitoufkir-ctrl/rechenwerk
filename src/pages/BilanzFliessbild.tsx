import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Download, FolderPlus, CheckCircle2, AlertTriangle, ArrowDown } from 'lucide-react'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { parseDecimal, formatNumber } from '../lib/format'
import { freiheitsgrad, loeseBilanz, type Block, type BilanzModell, type Komponente, type Strom } from '../lib/bilanz'
import { csvAusZeilen, csvHerunterladen } from '../lib/csv'
import { getProjekte, projektAnlegen, projektNotizHinzufuegen } from '../lib/storage'
import { BottomSheet } from '../components/BottomSheet'
import { EmptyState } from '../components/EmptyState'

type BlockTyp = Block['typ']

const BLOCK_LABEL: Record<BlockTyp, string> = {
  zulauf: 'Zulauf',
  mischer: 'Mischer',
  splitter: 'Splitter',
  trenner: 'Trenner',
  produkt: 'Produkt',
}

function neueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function BilanzFliessbild() {
  useSetHeaderTitle('Bilanz-Fließbild')

  const [komponenten, setKomponenten] = useState<Komponente[]>([{ id: neueId('k'), name: 'A' }])
  const [stroeme, setStroeme] = useState<Strom[]>([])
  const [bloecke, setBloecke] = useState<Block[]>([])

  const [neueKomponente, setNeueKomponente] = useState('')
  const [neuerStrom, setNeuerStrom] = useState('')

  const [blockSheetOffen, setBlockSheetOffen] = useState(false)
  const [neuerBlockTyp, setNeuerBlockTyp] = useState<BlockTyp>('zulauf')
  const [blockName, setBlockName] = useState('')
  const [blockAusgang, setBlockAusgang] = useState('')
  const [blockEingang, setBlockEingang] = useState('')
  const [blockEingaenge, setBlockEingaenge] = useState<string[]>([])
  const [blockKopfstrom, setBlockKopfstrom] = useState('')
  const [blockSumpfstrom, setBlockSumpfstrom] = useState('')
  const [blockMassenstrom, setBlockMassenstrom] = useState('')
  const [blockAnteile, setBlockAnteile] = useState<Record<string, string>>({})
  const [splitterAusgaenge, setSplitterAusgaenge] = useState<{ strom: string; anteil: string }[]>([])

  const [ergebnisSichtbar, setErgebnisSichtbar] = useState(false)
  const [gespeichertHinweis, setGespeichertHinweis] = useState<string | null>(null)

  const modell: BilanzModell = { komponenten, stroeme, bloecke }
  const fg = stroeme.length > 0 ? freiheitsgrad(modell) : null

  function komponenteHinzufuegen(): void {
    if (!neueKomponente.trim() || komponenten.length >= 6) return
    setKomponenten((k) => [...k, { id: neueId('k'), name: neueKomponente.trim() }])
    setNeueKomponente('')
  }
  function stromHinzufuegen(): void {
    if (!neuerStrom.trim()) return
    setStroeme((s) => [...s, { id: neueId('s'), name: neuerStrom.trim() }])
    setNeuerStrom('')
  }

  function blockFormularZuruecksetzen(): void {
    setBlockName('')
    setBlockAusgang('')
    setBlockEingang('')
    setBlockEingaenge([])
    setBlockKopfstrom('')
    setBlockSumpfstrom('')
    setBlockMassenstrom('')
    setBlockAnteile({})
    setSplitterAusgaenge([])
  }

  function blockHinzufuegen(): void {
    const id = neueId('b')
    const name = blockName.trim() || BLOCK_LABEL[neuerBlockTyp]
    let block: Block
    if (neuerBlockTyp === 'zulauf') {
      if (!blockAusgang) return
      const anteile: Record<string, number> = {}
      for (const k of komponenten) anteile[k.id] = parseDecimal(blockAnteile[k.id] ?? '') ?? 0
      block = { typ: 'zulauf', id, name, ausgang: blockAusgang, massenstromKgH: parseDecimal(blockMassenstrom) ?? 0, anteile }
    } else if (neuerBlockTyp === 'mischer') {
      if (blockEingaenge.length < 2 || !blockAusgang) return
      block = { typ: 'mischer', id, name, eingaenge: blockEingaenge, ausgang: blockAusgang }
    } else if (neuerBlockTyp === 'splitter') {
      if (!blockEingang || splitterAusgaenge.length < 2) return
      block = {
        typ: 'splitter',
        id,
        name,
        eingang: blockEingang,
        ausgaenge: splitterAusgaenge.map((a) => ({ strom: a.strom, anteil: parseDecimal(a.anteil) ?? 0 })),
      }
    } else if (neuerBlockTyp === 'trenner') {
      if (!blockEingang || !blockKopfstrom || !blockSumpfstrom) return
      const anteilKopf: Record<string, number> = {}
      for (const k of komponenten) anteilKopf[k.id] = parseDecimal(blockAnteile[k.id] ?? '') ?? 0
      block = { typ: 'trenner', id, name, eingang: blockEingang, kopfstrom: blockKopfstrom, sumpfstrom: blockSumpfstrom, anteilKopf }
    } else {
      if (!blockEingang) return
      block = { typ: 'produkt', id, name, eingang: blockEingang }
    }
    setBloecke((b) => [...b, block])
    blockFormularZuruecksetzen()
    setBlockSheetOffen(false)
  }

  function blockEntfernen(id: string): void {
    setBloecke((b) => b.filter((x) => x.id !== id))
  }
  function blockVerschieben(i: number, richtung: -1 | 1): void {
    setBloecke((b) => {
      const j = i + richtung
      if (j < 0 || j >= b.length) return b
      const neu = [...b]
      ;[neu[i], neu[j]] = [neu[j], neu[i]]
      return neu
    })
  }

  function stromName(id: string): string {
    return stroeme.find((s) => s.id === id)?.name ?? id
  }

  let loesung: ReturnType<typeof loeseBilanz> | null = null
  let loesungsFehler: string | null = null
  if (ergebnisSichtbar && fg?.status === 'bestimmt') {
    try {
      loesung = loeseBilanz(modell)
    } catch (e) {
      loesungsFehler = e instanceof Error ? e.message : 'Lösung fehlgeschlagen.'
    }
  }

  function csvExportieren(): void {
    if (!loesung) return
    const header = ['Strom', 'Gesamt (kg/h)', ...komponenten.map((k) => k.name)]
    const zeilen = stroeme.map((s) => [
      s.name,
      formatNumber(loesung!.stromGesamt[s.id], 4),
      ...komponenten.map((k) => formatNumber(loesung!.stromAnteile[s.id][k.id], 5)),
    ])
    csvHerunterladen('bilanz-fliessbild.csv', csvAusZeilen(header, zeilen))
  }

  function imProjektSpeichern(): void {
    if (!loesung) return
    const projekte = getProjekte()
    const projekt = projekte[0] ?? projektAnlegen('Bilanz-Fließbild', '')
    const text = [
      'Bilanz-Fließbild:',
      ...stroeme.map((s) => `${s.name}: ${formatNumber(loesung!.stromGesamt[s.id], 4)} kg/h, Anteile: ${komponenten.map((k) => `${k.name}=${formatNumber(loesung!.stromAnteile[s.id][k.id] * 100, 2)}%`).join(', ')}`),
      `Bilanzfehler Σ Zulauf - Σ Produkt: ${formatNumber(loesung!.bilanzfehlerKgH, 6)} kg/h`,
    ].join('\n')
    projektNotizHinzufuegen(projekt.id, text)
    setGespeichertHinweis('Im Projekt gespeichert.')
    setTimeout(() => setGespeichertHinweis(null), 1800)
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Komponenten (max. 6)</span>
        <div className="flex flex-wrap gap-2">
          {komponenten.map((k) => (
            <span key={k.id} className="flex items-center gap-1.5 rounded-full bg-paper-200 px-3 py-1.5 text-[13px] text-stone-700">
              {k.name}
              <button onClick={() => setKomponenten((ks) => ks.filter((x) => x.id !== k.id))} aria-label="Entfernen">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        {komponenten.length < 6 && (
          <div className="flex gap-2">
            <input value={neueKomponente} onChange={(e) => setNeueKomponente(e.target.value)} placeholder="Name der Komponente" className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-200 px-3 py-2 text-[15px]" />
            <button onClick={komponenteHinzufuegen} className="shrink-0 rounded-lg bg-paper-200 p-2 text-stone-600" aria-label="Komponente hinzufügen">
              <Plus size={16} />
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Ströme</span>
        <div className="flex flex-wrap gap-2">
          {stroeme.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-paper-200 px-3 py-1.5 text-[13px] text-stone-700">
              {s.name}
              <button onClick={() => setStroeme((ss) => ss.filter((x) => x.id !== s.id))} aria-label="Entfernen">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={neuerStrom} onChange={(e) => setNeuerStrom(e.target.value)} placeholder="Name des Stroms" className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-200 px-3 py-2 text-[15px]" />
          <button onClick={stromHinzufuegen} className="shrink-0 rounded-lg bg-paper-200 p-2 text-stone-600" aria-label="Strom hinzufügen">
            <Plus size={16} />
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Blöcke</span>
        {bloecke.length === 0 && <EmptyState icon={Plus} text="Noch keine Blöcke. Lege zuerst Ströme an, dann Zulauf/Mischer/Splitter/Trenner/Produkt." />}
        <div className="flex flex-col gap-1.5">
          {bloecke.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2 rounded-xl bg-paper-200 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-stone-900">
                  {b.name} <span className="text-[12px] text-stone-500">({BLOCK_LABEL[b.typ]})</span>
                </p>
                <p className="truncate text-[12px] text-stone-500">
                  {b.typ === 'zulauf' && `→ ${stromName(b.ausgang)}`}
                  {b.typ === 'mischer' && `${b.eingaenge.map(stromName).join(' + ')} → ${stromName(b.ausgang)}`}
                  {b.typ === 'splitter' && `${stromName(b.eingang)} → ${b.ausgaenge.map((a) => stromName(a.strom)).join(', ')}`}
                  {b.typ === 'trenner' && `${stromName(b.eingang)} → Kopf: ${stromName(b.kopfstrom)}, Sumpf: ${stromName(b.sumpfstrom)}`}
                  {b.typ === 'produkt' && `${stromName(b.eingang)} → Ende`}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <button onClick={() => blockVerschieben(i, -1)} aria-label="Nach oben" className="rounded-lg p-1.5 text-stone-400"><ChevronUp size={16} /></button>
                <button onClick={() => blockVerschieben(i, 1)} aria-label="Nach unten" className="rounded-lg p-1.5 text-stone-400"><ChevronDown size={16} /></button>
                <button onClick={() => blockEntfernen(b.id)} aria-label="Löschen" className="rounded-lg p-1.5 text-stone-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setBlockSheetOffen(true)}
          disabled={stroeme.length === 0}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-paper-300 py-2.5 text-[14px] text-stone-500 disabled:opacity-40"
        >
          <Plus size={16} /> Block hinzufügen
        </button>
      </section>

      {bloecke.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <span className="eyebrow px-1">Schema</span>
          <div className="flex flex-col items-stretch gap-1">
            {bloecke.map((b, i) => (
              <div key={b.id} className="flex flex-col items-center gap-1">
                <div className="w-full rounded-lg bg-paper-50 px-3 py-2 text-center text-[13px] text-stone-700">
                  {b.name} <span className="text-stone-500">({BLOCK_LABEL[b.typ]})</span>
                </div>
                {i < bloecke.length - 1 && <ArrowDown size={14} className="text-stone-400" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {fg && (
        <div className={`flex items-start gap-2 rounded-xl p-3 text-[13px] ${fg.status === 'bestimmt' ? 'bg-sage-100 text-sage-800' : 'bg-amber-50 text-amber-900'}`}>
          {fg.status === 'bestimmt' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
          <span>
            {fg.hinweis} ({fg.gleichungen} Gleichungen, {fg.unbekannte} Unbekannte)
          </span>
        </div>
      )}

      {stroeme.length > 0 && (
        <button
          onClick={() => setErgebnisSichtbar(true)}
          disabled={fg?.status !== 'bestimmt'}
          className="rounded-xl bg-accent-600 py-3 text-center text-[16px] font-medium text-ink disabled:opacity-40"
        >
          Lösen
        </button>
      )}

      {loesungsFehler && <p className="rounded-xl bg-red-50 p-3 text-[14px] text-red-800">{loesungsFehler}</p>}

      {loesung && (
        <section className="flex flex-col gap-3">
          <span className="eyebrow px-1">Stromtabelle</span>
          <div className="overflow-x-auto rounded-xl bg-paper-200">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-stone-500">
                  <th className="px-2.5 py-1.5">Strom</th>
                  <th className="px-2.5 py-1.5">Gesamt (kg/h)</th>
                  {komponenten.map((k) => (
                    <th key={k.id} className="px-2.5 py-1.5">
                      {k.name}
                    </th>
                  ))}
                  <th className="px-2.5 py-1.5">Σ Anteile</th>
                </tr>
              </thead>
              <tbody>
                {stroeme.map((s) => {
                  const pruefung = loesung!.pruefungAnteile.find((p) => p.stromId === s.id)
                  return (
                    <tr key={s.id} className="border-t border-paper-300">
                      <td className="px-2.5 py-1.5">{s.name}</td>
                      <td className="px-2.5 py-1.5 tabular-nums">{formatNumber(loesung!.stromGesamt[s.id], 4)}</td>
                      {komponenten.map((k) => (
                        <td key={k.id} className="px-2.5 py-1.5 tabular-nums">
                          {formatNumber(loesung!.stromAnteile[s.id][k.id] * 100, 2)}%
                        </td>
                      ))}
                      <td className="px-2.5 py-1.5 tabular-nums">{pruefung ? formatNumber(pruefung.summeAnteile * 100, 2) : ''}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-stone-600">
            Prüfung Σ Zulauf = Σ Produkt: Abweichung {formatNumber(loesung.bilanzfehlerKgH, 6)} kg/h.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={csvExportieren} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
              <Download size={14} /> CSV exportieren
            </button>
            <button onClick={imProjektSpeichern} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
              <FolderPlus size={14} /> Im Projekt speichern
            </button>
          </div>
          {gespeichertHinweis && <p className="text-[12px] text-sage-600">{gespeichertHinweis}</p>}
        </section>
      )}

      <BottomSheet offen={blockSheetOffen} onClose={() => { setBlockSheetOffen(false); blockFormularZuruecksetzen() }} titel="Block hinzufügen">
        <div className="flex flex-col gap-3 px-4 pb-8 pt-2">
          <div className="flex flex-wrap gap-2">
            {(['zulauf', 'mischer', 'splitter', 'trenner', 'produkt'] as BlockTyp[]).map((t) => (
              <button
                key={t}
                onClick={() => setNeuerBlockTyp(t)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${neuerBlockTyp === t ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'}`}
              >
                {BLOCK_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-stone-500">Name (optional)</label>
            <input value={blockName} onChange={(e) => setBlockName(e.target.value)} className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
          </div>

          {neuerBlockTyp === 'zulauf' && (
            <>
              <StromAuswahl label="Ausgangsstrom" stroeme={stroeme} wert={blockAusgang} onChange={setBlockAusgang} />
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-stone-500">Massenstrom (kg/h)</label>
                <input value={blockMassenstrom} onChange={(e) => setBlockMassenstrom(e.target.value)} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
              </div>
              <AnteileEingabe komponenten={komponenten} anteile={blockAnteile} onChange={setBlockAnteile} titel="Massenanteile" />
            </>
          )}

          {neuerBlockTyp === 'mischer' && (
            <>
              <MehrfachStromAuswahl label="Eingangsströme" stroeme={stroeme} werte={blockEingaenge} onChange={setBlockEingaenge} />
              <StromAuswahl label="Ausgangsstrom" stroeme={stroeme.filter((s) => !blockEingaenge.includes(s.id))} wert={blockAusgang} onChange={setBlockAusgang} />
            </>
          )}

          {neuerBlockTyp === 'splitter' && (
            <>
              <StromAuswahl label="Eingangsstrom" stroeme={stroeme} wert={blockEingang} onChange={setBlockEingang} />
              <div className="flex flex-col gap-2">
                <span className="text-[12px] text-stone-500">Ausgänge mit Teilungsverhältnis (Summe = 1)</span>
                {splitterAusgaenge.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={a.strom}
                      onChange={(e) => setSplitterAusgaenge((as) => as.map((x, idx) => (idx === i ? { ...x, strom: e.target.value } : x)))}
                      className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-2 py-2 text-[15px]"
                    >
                      <option value="">Strom wählen</option>
                      {stroeme.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={a.anteil}
                      onChange={(e) => setSplitterAusgaenge((as) => as.map((x, idx) => (idx === i ? { ...x, anteil: e.target.value } : x)))}
                      placeholder="Anteil"
                      inputMode="decimal"
                      className="w-20 shrink-0 rounded-lg border border-paper-300 bg-paper-50 px-2 py-2 text-[15px]"
                    />
                    <button onClick={() => setSplitterAusgaenge((as) => as.filter((_, idx) => idx !== i))} aria-label="Entfernen" className="shrink-0 text-stone-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setSplitterAusgaenge((as) => [...as, { strom: '', anteil: '' }])} className="self-start text-[13px] font-medium text-accent-600">
                  + Ausgang
                </button>
              </div>
            </>
          )}

          {neuerBlockTyp === 'trenner' && (
            <>
              <StromAuswahl label="Eingangsstrom" stroeme={stroeme} wert={blockEingang} onChange={setBlockEingang} />
              <StromAuswahl label="Kopfstrom" stroeme={stroeme} wert={blockKopfstrom} onChange={setBlockKopfstrom} />
              <StromAuswahl label="Sumpfstrom" stroeme={stroeme} wert={blockSumpfstrom} onChange={setBlockSumpfstrom} />
              <AnteileEingabe komponenten={komponenten} anteile={blockAnteile} onChange={setBlockAnteile} titel="Anteil je Komponente in den Kopfstrom (0-1)" />
            </>
          )}

          {neuerBlockTyp === 'produkt' && <StromAuswahl label="Eingangsstrom" stroeme={stroeme} wert={blockEingang} onChange={setBlockEingang} />}

          <button onClick={blockHinzufuegen} className="rounded-xl bg-accent-600 py-2.5 text-[14px] font-medium text-ink">
            Hinzufügen
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

function StromAuswahl({ label, stroeme, wert, onChange }: { label: string; stroeme: Strom[]; wert: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] text-stone-500">{label}</label>
      <select value={wert} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]">
        <option value="">Strom wählen</option>
        {stroeme.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function MehrfachStromAuswahl({ label, stroeme, werte, onChange }: { label: string; stroeme: Strom[]; werte: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] text-stone-500">{label}</label>
      <div className="flex flex-wrap gap-2">
        {stroeme.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(werte.includes(s.id) ? werte.filter((x) => x !== s.id) : [...werte, s.id])}
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${werte.includes(s.id) ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'}`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function AnteileEingabe({
  komponenten,
  anteile,
  onChange,
  titel,
}: {
  komponenten: Komponente[]
  anteile: Record<string, string>
  onChange: (a: Record<string, string>) => void
  titel: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] text-stone-500">{titel}</span>
      {komponenten.map((k) => (
        <div key={k.id} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[13px] text-stone-600">{k.name}</span>
          <input
            value={anteile[k.id] ?? ''}
            onChange={(e) => onChange({ ...anteile, [k.id]: e.target.value })}
            inputMode="decimal"
            className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[15px]"
          />
        </div>
      ))}
    </div>
  )
}
