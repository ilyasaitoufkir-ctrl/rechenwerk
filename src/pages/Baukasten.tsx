import { useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Download,
  FolderPlus,
  Save,
  FlaskConical,
  Thermometer,
} from 'lucide-react'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import { parseDecimal, formatNumber } from '../lib/format'
import { berechneStrang, anlagenkennlinie, type BaukastenElement, type Medium } from '../lib/baukasten'
import { region1 } from '../lib/iapws-if97'
import { einbauten } from '../data/fittings'
import { rauheitstabelle } from '../data/roughness'
import { din11850Reihe2 } from '../data/pipes-din11850'
import { csvAusZeilen, csvHerunterladen } from '../lib/csv'
import { kennlinieAblegen, getProjekte, projektAnlegen, projektNotizHinzufuegen, strangSpeichern } from '../lib/storage'
import { BottomSheet } from '../components/BottomSheet'
import { EmptyState } from '../components/EmptyState'
import { LineChart } from '../components/LineChart'
import { StoffWaehlenSheet } from '../components/StoffWaehlenSheet'

type ElementTyp = BaukastenElement['typ']

const TYP_LABEL: Record<ElementTyp, string> = {
  rohr: 'Gerades Rohr',
  einzelwiderstand: 'Bogen / Einlauf / Auslauf / Armatur',
  ventilKv: 'Ventil (Kv-Wert)',
  erweiterung: 'Plötzliche Erweiterung',
  verengung: 'Plötzliche Verengung',
  hoehenunterschied: 'Höhenunterschied',
}

function neueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function TabellenWertSheet({
  offen,
  onClose,
  titel,
  zeilen,
  onSelect,
}: {
  offen: boolean
  onClose: () => void
  titel: string
  zeilen: { label: string; wert: number; nebenwert?: string }[]
  onSelect: (wert: number) => void
}) {
  return (
    <BottomSheet offen={offen} onClose={onClose} titel={titel}>
      <div className="flex flex-col gap-1 px-4 pb-6 pt-2">
        {zeilen.map((z, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(z.wert)
              onClose()
            }}
            className="flex items-center justify-between rounded-xl bg-paper-200 px-3.5 py-3 text-left"
          >
            <span className="text-[14px] text-stone-900">{z.label}</span>
            <span className="text-[13px] text-stone-500">{z.nebenwert ?? z.wert}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

export function Baukasten() {
  useSetHeaderTitle('Rohrleitungs-Baukasten')

  const [rhoText, setRhoText] = useState('1000')
  const [etaMPasText, setEtaMPasText] = useState('1')
  const [volumenstromM3hText, setVolumenstromM3hText] = useState('10')

  const [wasserSheetOffen, setWasserSheetOffen] = useState(false)
  const [wasserTemperaturC, setWasserTemperaturC] = useState('20')
  const [wasserFehler, setWasserFehler] = useState<string | null>(null)
  const [stoffDichteSheetOffen, setStoffDichteSheetOffen] = useState(false)
  const [stoffViskositaetSheetOffen, setStoffViskositaetSheetOffen] = useState(false)

  const [elemente, setElemente] = useState<(BaukastenElement & { id: string })[]>([])
  const [addSheetOffen, setAddSheetOffen] = useState(false)
  const [neuerTyp, setNeuerTyp] = useState<ElementTyp>('rohr')
  const [neuesElement, setNeuesElement] = useState<Record<string, string>>({})
  const [dnSheetOffen, setDnSheetOffen] = useState(false)
  const [rauheitSheetOffen, setRauheitSheetOffen] = useState(false)
  const [zetaSheetOffen, setZetaSheetOffen] = useState(false)
  const [dnFeld, setDnFeld] = useState<'innenDurchmesserMm' | 'bezugsDurchmesserMm'>('innenDurchmesserMm')

  const [kennlinieSichtbar, setKennlinieSichtbar] = useState(false)
  const [gespeichertHinweis, setGespeichertHinweis] = useState<string | null>(null)

  const medium: Medium = { rhoKgM3: parseDecimal(rhoText) ?? 0, etaPas: (parseDecimal(etaMPasText) ?? 0) / 1000 }
  const volumenstromM3s = (parseDecimal(volumenstromM3hText) ?? 0) / 3600

  let strang: ReturnType<typeof berechneStrang> | { fehler: string } | null = null
  if (medium.rhoKgM3 > 0 && medium.etaPas > 0 && volumenstromM3s > 0 && elemente.length > 0) {
    try {
      strang = berechneStrang(elemente, medium, volumenstromM3s)
    } catch (e) {
      strang = { fehler: e instanceof Error ? e.message : 'Rechenfehler' }
    }
  }

  function wasserUebernehmen(): void {
    const tC = parseDecimal(wasserTemperaturC)
    if (tC === null) return
    try {
      const zustand = region1(tC + 273.15, 0.101325)
      setRhoText(formatNumber(zustand.rho, 5).replace(',', '.'))
      setWasserFehler(null)
      setWasserSheetOffen(false)
    } catch (e) {
      setWasserFehler(e instanceof Error ? e.message : 'Außerhalb des gültigen Bereichs.')
    }
  }

  function elementHinzufuegen(): void {
    const n = (key: string) => parseDecimal(neuesElement[key] ?? '') ?? 0
    const id = neueId()
    let element: BaukastenElement
    switch (neuerTyp) {
      case 'rohr':
        element = { typ: 'rohr', id, name: 'Rohr', innenDurchmesserM: n('innenDurchmesserMm') / 1000, laengeM: n('laengeM'), rauheitM: n('rauheitMm') / 1000 }
        break
      case 'einzelwiderstand':
        element = { typ: 'einzelwiderstand', id, name: neuesElement.name || 'Einzelwiderstand', zeta: n('zeta'), bezugsDurchmesserM: n('bezugsDurchmesserMm') / 1000 }
        break
      case 'ventilKv':
        element = { typ: 'ventilKv', id, name: 'Ventil', kvM3hBar: n('kvM3hBar') }
        break
      case 'erweiterung':
        element = { typ: 'erweiterung', id, name: 'Erweiterung', a1M2: n('a1Mm2') / 1e6, a2M2: n('a2Mm2') / 1e6 }
        break
      case 'verengung':
        element = { typ: 'verengung', id, name: 'Verengung', a1M2: n('a1Mm2') / 1e6, a2M2: n('a2Mm2') / 1e6, zeta: n('zeta') }
        break
      case 'hoehenunterschied':
        element = { typ: 'hoehenunterschied', id, name: 'Höhenunterschied', deltaZM: n('deltaZM') }
        break
    }
    setElemente((es) => [...es, element as BaukastenElement & { id: string }])
    setNeuesElement({})
    setAddSheetOffen(false)
  }

  function entfernen(id: string): void {
    setElemente((es) => es.filter((e) => e.id !== id))
  }
  function verschieben(i: number, richtung: -1 | 1): void {
    setElemente((es) => {
      const j = i + richtung
      if (j < 0 || j >= es.length) return es
      const neu = [...es]
      ;[neu[i], neu[j]] = [neu[j], neu[i]]
      return neu
    })
  }

  function anlagenkennlinieUebergeben(): void {
    if (medium.rhoKgM3 <= 0 || medium.etaPas <= 0 || elemente.length === 0) return
    const vRef = volumenstromM3s > 0 ? volumenstromM3s : 0.01
    const bereich = Array.from({ length: 15 }, (_, i) => vRef * 0.2 * (i + 1))
    const kennlinie = anlagenkennlinie(elemente, medium, bereich)
    kennlinieAblegen(kennlinie.map((p) => ({ v: formatNumber(p.vM3h, 4), h: formatNumber(p.hM, 4) })))
    navigiere({ name: 'pumpen-betriebspunkt' })
  }

  function csvExportieren(): void {
    if (!strang || 'fehler' in strang) return
    const header = ['Element', 'Kategorie', 'Geschwindigkeit (m/s)', 'Reynoldszahl', 'λ', 'Δp (Pa)']
    const zeilen = strang.elemente.map((e, i) => [
      elemente[i]?.name ?? e.elementId,
      e.kategorie,
      e.geschwindigkeitMS !== undefined ? formatNumber(e.geschwindigkeitMS, 4) : '',
      e.reynoldszahl !== undefined ? formatNumber(e.reynoldszahl, 4) : '',
      e.lambda !== undefined ? formatNumber(e.lambda, 5) : '',
      formatNumber(e.druckverlustPa, 4),
    ])
    csvHerunterladen('rohrleitungs-baukasten.csv', csvAusZeilen(header, zeilen))
  }

  function imProjektAblegen(): void {
    if (!strang || 'fehler' in strang) return
    const projekte = getProjekte()
    const projekt = projekte[0] ?? projektAnlegen('Rohrleitungs-Baukasten', '')
    const text = [
      `Rohrleitungs-Baukasten: Medium ρ=${rhoText} kg/m³, η=${etaMPasText} mPa·s, V̇=${volumenstromM3hText} m³/h`,
      ...strang.elemente.map((e, i) => `${elemente[i]?.name}: Δp=${formatNumber(e.druckverlustPa, 4)} Pa`),
      `Gesamt: Reibung ${formatNumber(strang.summeReibungPa, 4)} Pa, Einzelwiderstände ${formatNumber(strang.summeEinzelwiderstandPa, 4)} Pa, Geodäsie ${formatNumber(strang.summeGeodaesiePa, 4)} Pa, Gesamt ${formatNumber(strang.summeGesamtPa, 4)} Pa (= ${formatNumber(strang.foerderhoeheM, 4)} m Förderhöhe)`,
    ].join('\n')
    projektNotizHinzufuegen(projekt.id, text)
    setGespeichertHinweis('Im Projekt abgelegt.')
    setTimeout(() => setGespeichertHinweis(null), 1800)
  }

  function strangSpeichernKlick(): void {
    const name = `Strang vom ${new Date().toLocaleDateString('de-DE')}`
    strangSpeichern(name, { rhoText, etaMPasText, volumenstromM3hText, elemente })
    setGespeichertHinweis('Strang gespeichert.')
    setTimeout(() => setGespeichertHinweis(null), 1800)
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <section className="flex flex-col gap-3">
        <span className="eyebrow px-1">Medium</span>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[12px] text-stone-500">Dichte (kg/m³)</label>
            <input value={rhoText} onChange={(e) => setRhoText(e.target.value)} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-200 px-3 py-2.5 text-[16px]" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[12px] text-stone-500">Viskosität (mPa·s)</label>
            <input value={etaMPasText} onChange={(e) => setEtaMPasText(e.target.value)} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-200 px-3 py-2.5 text-[16px]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setWasserSheetOffen(true)} className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1.5 text-[12px] font-medium text-accent-700">
            <Thermometer size={13} />
            Wasser (IF97) - Dichte übernehmen
          </button>
          <button onClick={() => setStoffDichteSheetOffen(true)} className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1.5 text-[12px] font-medium text-accent-700">
            <FlaskConical size={13} />
            Eigener Stoff - Dichte
          </button>
          <button onClick={() => setStoffViskositaetSheetOffen(true)} className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1.5 text-[12px] font-medium text-accent-700">
            <FlaskConical size={13} />
            Eigener Stoff - Viskosität
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-stone-500">Volumenstrom (m³/h)</label>
          <input value={volumenstromM3hText} onChange={(e) => setVolumenstromM3hText(e.target.value)} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-200 px-3 py-2.5 text-[16px]" />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="eyebrow">Elemente</span>
        </div>
        {elemente.length === 0 && <EmptyState icon={Plus} text="Noch keine Elemente. Füge Rohre, Bögen, Ventile oder Höhenunterschiede hinzu." />}
        <div className="flex flex-col gap-2">
          {elemente.map((e, i) => {
            const ergebnis = strang && !('fehler' in strang) ? strang.elemente[i] : undefined
            return (
              <div key={e.id} className="flex flex-col gap-1 rounded-xl bg-paper-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-stone-900">
                      {i + 1}. {e.name} <span className="text-[12px] text-stone-500">({TYP_LABEL[e.typ]})</span>
                    </p>
                    {ergebnis && (
                      <p className="text-[12px] text-stone-500">
                        {ergebnis.geschwindigkeitMS !== undefined && `v=${formatNumber(ergebnis.geschwindigkeitMS, 3)} m/s · `}
                        {ergebnis.reynoldszahl !== undefined && `Re=${formatNumber(ergebnis.reynoldszahl, 3)} · `}
                        {ergebnis.lambda !== undefined && `λ=${formatNumber(ergebnis.lambda, 4)} · `}
                        Δp={formatNumber(ergebnis.druckverlustPa, 4)} Pa
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button onClick={() => verschieben(i, -1)} aria-label="Nach oben" className="rounded-lg p-1.5 text-stone-400">
                      <ChevronUp size={16} />
                    </button>
                    <button onClick={() => verschieben(i, 1)} aria-label="Nach unten" className="rounded-lg p-1.5 text-stone-400">
                      <ChevronDown size={16} />
                    </button>
                    <button onClick={() => entfernen(e.id)} aria-label="Löschen" className="rounded-lg p-1.5 text-stone-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={() => setAddSheetOffen(true)} className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-paper-300 py-2.5 text-[14px] text-stone-500">
          <Plus size={16} /> Element hinzufügen
        </button>
      </section>

      {strang && 'fehler' in strang && <p className="rounded-xl bg-red-50 p-3 text-[14px] text-red-800">{strang.fehler}</p>}

      {strang && !('fehler' in strang) && (
        <section className="flex flex-col gap-3">
          <span className="eyebrow px-1">Ergebnis</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-paper-200 p-3">
              <p className="text-[12px] text-stone-500">Reibung</p>
              <p className="tabular-nums text-[18px] font-semibold text-stone-900">{formatNumber(strang.summeReibungPa, 4)} Pa</p>
            </div>
            <div className="rounded-xl bg-paper-200 p-3">
              <p className="text-[12px] text-stone-500">Einzelwiderstände</p>
              <p className="tabular-nums text-[18px] font-semibold text-stone-900">{formatNumber(strang.summeEinzelwiderstandPa, 4)} Pa</p>
            </div>
            <div className="rounded-xl bg-paper-200 p-3">
              <p className="text-[12px] text-stone-500">Geodäsie</p>
              <p className="tabular-nums text-[18px] font-semibold text-stone-900">{formatNumber(strang.summeGeodaesiePa, 4)} Pa</p>
            </div>
            <div className="rounded-xl bg-accent-100 p-3">
              <p className="text-[12px] text-accent-700">Gesamt</p>
              <p className="tabular-nums text-[18px] font-semibold text-accent-900">{formatNumber(strang.summeGesamtPa, 4)} Pa</p>
            </div>
          </div>
          <p className="text-[14px] text-stone-700">
            Entspricht einer Förderhöhe von <span className="font-semibold">{formatNumber(strang.foerderhoeheM, 4)} m</span>.
          </p>

          {/* Schematische Darstellung: vertikal gestapelte Symbole, immer volle Breite ohne Überlauf */}
          <div className="flex flex-col gap-1">
            {elemente.map((e, i) => (
              <div key={e.id} className="flex items-center gap-2 rounded-lg bg-paper-50 px-2.5 py-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-accent-600" />
                <span className="min-w-0 flex-1 truncate text-[12px] text-stone-600">{e.name}</span>
                {i < elemente.length - 1 && <ArrowRight size={12} className="shrink-0 text-stone-400" />}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={csvExportieren} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
              <Download size={14} /> CSV exportieren
            </button>
            <button onClick={imProjektAblegen} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
              <FolderPlus size={14} /> Im Projekt ablegen
            </button>
            <button onClick={strangSpeichernKlick} className="flex items-center gap-1.5 rounded-lg bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700">
              <Save size={14} /> Strang speichern
            </button>
          </div>
          {gespeichertHinweis && <p className="text-[12px] text-sage-600">{gespeichertHinweis}</p>}

          <button onClick={() => setKennlinieSichtbar((v) => !v)} className="rounded-xl bg-paper-200 px-4 py-3 text-left text-[14px] font-medium text-stone-700">
            {kennlinieSichtbar ? 'Anlagenkennlinie ausblenden' : 'Anlagenkennlinie berechnen'}
          </button>
          {kennlinieSichtbar && (
            <div className="flex flex-col gap-3">
              <LineChart
                ariaLabel="Anlagenkennlinie"
                reihen={[
                  {
                    label: 'H_A(V̇)',
                    farbe: '#c8a86b',
                    punkte: anlagenkennlinie(elemente, medium, Array.from({ length: 15 }, (_, i) => volumenstromM3s * 0.2 * (i + 1))).map((p) => ({ x: p.vM3h, y: p.hM })),
                  },
                ]}
              />
              <button onClick={anlagenkennlinieUebergeben} className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-600 py-3 text-[15px] font-medium text-ink">
                An Pumpen-Betriebspunkt übergeben
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}

      <BottomSheet offen={wasserSheetOffen} onClose={() => setWasserSheetOffen(false)} titel="Wasser (IF97)">
        <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-stone-500">Temperatur (°C), bei 1,013 bar</label>
            <input value={wasserTemperaturC} onChange={(e) => setWasserTemperaturC(e.target.value)} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
          </div>
          {wasserFehler && <p className="text-[13px] text-red-600">{wasserFehler}</p>}
          <button onClick={wasserUebernehmen} className="rounded-xl bg-accent-600 py-2.5 text-[14px] font-medium text-ink">
            Dichte übernehmen
          </button>
          <p className="text-[12px] text-stone-500">Viskosität ist in dieser App-Version nicht über IF97 hinterlegt - bitte manuell eingeben.</p>
        </div>
      </BottomSheet>

      <StoffWaehlenSheet offen={stoffDichteSheetOffen} onClose={() => setStoffDichteSheetOffen(false)} eigenschaft="dichteKgM3" onSelect={(w) => setRhoText(formatNumber(w, 6).replace(',', '.'))} />
      <StoffWaehlenSheet
        offen={stoffViskositaetSheetOffen}
        onClose={() => setStoffViskositaetSheetOffen(false)}
        eigenschaft="viskositaetPas"
        onSelect={(w) => setEtaMPasText(formatNumber(w * 1000, 6).replace(',', '.'))}
      />

      <BottomSheet offen={addSheetOffen} onClose={() => setAddSheetOffen(false)} titel="Element hinzufügen">
        <div className="flex flex-col gap-3 px-4 pb-8 pt-2">
          <div className="flex flex-wrap gap-2">
            {(['rohr', 'einzelwiderstand', 'ventilKv', 'erweiterung', 'verengung', 'hoehenunterschied'] as ElementTyp[]).map((t) => (
              <button
                key={t}
                onClick={() => setNeuerTyp(t)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${neuerTyp === t ? 'bg-accent-600 text-ink' : 'bg-paper-200 text-stone-600'}`}
              >
                {TYP_LABEL[t]}
              </button>
            ))}
          </div>

          {neuerTyp === 'rohr' && (
            <>
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[12px] text-stone-500">Innendurchmesser (mm)</label>
                  <input value={neuesElement.innenDurchmesserMm ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, innenDurchmesserMm: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
                <button onClick={() => { setDnFeld('innenDurchmesserMm'); setDnSheetOffen(true) }} className="shrink-0 rounded-lg bg-paper-200 px-3 py-2 text-[12px] text-stone-600">
                  DN wählen
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-stone-500">Länge (m)</label>
                <input value={neuesElement.laengeM ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, laengeM: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[12px] text-stone-500">Rauheit k (mm)</label>
                  <input value={neuesElement.rauheitMm ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, rauheitMm: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
                <button onClick={() => setRauheitSheetOffen(true)} className="shrink-0 rounded-lg bg-paper-200 px-3 py-2 text-[12px] text-stone-600">
                  Aus Tabelle
                </button>
              </div>
            </>
          )}

          {neuerTyp === 'einzelwiderstand' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-stone-500">Name</label>
                <input value={neuesElement.name ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, name: e.target.value }))} className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[12px] text-stone-500">ζ</label>
                  <input value={neuesElement.zeta ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, zeta: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
                <button onClick={() => setZetaSheetOffen(true)} className="shrink-0 rounded-lg bg-paper-200 px-3 py-2 text-[12px] text-stone-600">
                  Aus Tabelle
                </button>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[12px] text-stone-500">Bezugsdurchmesser (mm)</label>
                  <input value={neuesElement.bezugsDurchmesserMm ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, bezugsDurchmesserMm: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
                <button onClick={() => { setDnFeld('bezugsDurchmesserMm'); setDnSheetOffen(true) }} className="shrink-0 rounded-lg bg-paper-200 px-3 py-2 text-[12px] text-stone-600">
                  DN wählen
                </button>
              </div>
            </>
          )}

          {neuerTyp === 'ventilKv' && (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-stone-500">Kv-Wert (m³/h bei 1 bar)</label>
              <input value={neuesElement.kvM3hBar ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, kvM3hBar: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
            </div>
          )}

          {(neuerTyp === 'erweiterung' || neuerTyp === 'verengung') && (
            <>
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[12px] text-stone-500">Querschnitt 1, A₁ (mm²)</label>
                  <input value={neuesElement.a1Mm2 ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, a1Mm2: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[12px] text-stone-500">Querschnitt 2, A₂ (mm²)</label>
                  <input value={neuesElement.a2Mm2 ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, a2Mm2: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
              </div>
              {neuerTyp === 'verengung' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] text-stone-500">ζ (Richtwert, bezogen auf A₂)</label>
                  <input value={neuesElement.zeta ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, zeta: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
                </div>
              )}
              {neuerTyp === 'erweiterung' && <p className="text-[12px] text-stone-500">ζ wird nach Borda-Carnot automatisch aus A₁/A₂ berechnet.</p>}
            </>
          )}

          {neuerTyp === 'hoehenunterschied' && (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-stone-500">Höhenunterschied Δz (m, positiv = aufwärts)</label>
              <input value={neuesElement.deltaZM ?? ''} onChange={(e) => setNeuesElement((s) => ({ ...s, deltaZM: e.target.value }))} inputMode="decimal" className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]" />
            </div>
          )}

          <button onClick={elementHinzufuegen} className="rounded-xl bg-accent-600 py-2.5 text-[14px] font-medium text-ink">
            Hinzufügen
          </button>
        </div>
      </BottomSheet>

      <TabellenWertSheet
        offen={dnSheetOffen}
        onClose={() => setDnSheetOffen(false)}
        titel="Nennweite DIN 11850"
        zeilen={din11850Reihe2.map((r) => ({ label: `DN ${r.dn}`, wert: r.innenDurchmesserMm, nebenwert: `Ø ${r.innenDurchmesserMm} mm` }))}
        onSelect={(w) => setNeuesElement((s) => ({ ...s, [dnFeld]: String(w) }))}
      />
      <TabellenWertSheet
        offen={rauheitSheetOffen}
        onClose={() => setRauheitSheetOffen(false)}
        titel="Rauheit"
        zeilen={rauheitstabelle.map((r) => ({ label: r.werkstoff, wert: r.kTypMm, nebenwert: `${r.kTypMm} mm` }))}
        onSelect={(w) => setNeuesElement((s) => ({ ...s, rauheitMm: String(w) }))}
      />
      <TabellenWertSheet
        offen={zetaSheetOffen}
        onClose={() => setZetaSheetOffen(false)}
        titel="Widerstandsbeiwert ζ"
        zeilen={einbauten.map((e) => ({ label: e.name, wert: e.zetaTyp }))}
        onSelect={(w) => setNeuesElement((s) => ({ ...s, zeta: String(w) }))}
      />
    </div>
  )
}
