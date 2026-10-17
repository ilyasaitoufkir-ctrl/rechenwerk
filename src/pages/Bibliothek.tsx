import { useMemo, useState } from 'react'
import { Download, Info, Gauge, Star } from 'lucide-react'
import { alleFormeln, getKategorien, sucheFormeln } from '../formulas/registry'
import { alleDatenTabellen } from '../data/registry'
import { SearchBar } from '../components/SearchBar'
import { SegmentedControl } from '../components/SegmentedControl'
import { VerificationBadge } from '../components/VerificationBadge'
import { EmptyState } from '../components/EmptyState'
import { useFavoriten } from '../hooks/useFavoriten'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import type { Quelle } from '../types/formula'

type Filter = 'alle' | 'unverifiziert' | 'richtwert' | 'verifiziert'

interface Eintrag {
  id: string
  name: string
  kategorie: string
  typ: 'Formel' | 'Tabelle'
  quelle: Quelle
  richtwert?: boolean
}

function alleEintraege(): Eintrag[] {
  const formeln: Eintrag[] = alleFormeln.map((f) => ({
    id: f.id,
    name: f.name,
    kategorie: f.kategorie,
    typ: 'Formel',
    quelle: f.quelle,
    richtwert: f.richtwert,
  }))
  const tabellen: Eintrag[] = alleDatenTabellen.map((t) => ({
    id: t.id,
    name: t.name,
    kategorie: t.kategorie,
    typ: 'Tabelle',
    quelle: t.quelle,
    richtwert: true,
  }))
  return [...formeln, ...tabellen]
}

export function Bibliothek() {
  useSetHeaderTitle('Bibliothek')
  const eintraege = useMemo(() => alleEintraege(), [])
  const { verifizierungen, setzen } = useVerifizierung()
  const { toggeln, istFavorit } = useFavoriten()
  const [suche, setSuche] = useState('')
  const [kategorie, setKategorie] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('alle')

  const kategorien = getKategorien()
  const verifizierteAnzahl = eintraege.filter((e) => verifizierungen[e.id]?.verifiziert).length

  const gefunden = useMemo(() => new Set(sucheFormeln(suche).map((f) => f.id)), [suche])

  const gefiltert = eintraege.filter((e) => {
    if (suche.trim() && e.typ === 'Formel' && !gefunden.has(e.id)) return false
    if (suche.trim() && e.typ === 'Tabelle' && !e.name.toLowerCase().includes(suche.trim().toLowerCase())) return false
    if (kategorie && e.kategorie !== kategorie) return false
    if (filter === 'unverifiziert') return !verifizierungen[e.id]?.verifiziert
    if (filter === 'richtwert') return e.richtwert
    if (filter === 'verifiziert') return verifizierungen[e.id]?.verifiziert
    return true
  })

  function exportMarkdown() {
    const zeilen = [
      '# Rechenwerk - Prüfliste',
      '',
      `Stand: ${new Date().toLocaleDateString('de-DE')} · ${verifizierteAnzahl} von ${eintraege.length} verifiziert`,
      '',
    ]
    for (const e of eintraege) {
      const v = verifizierungen[e.id]
      const status = v?.verifiziert ? `verifiziert am ${new Date(v.datum).toLocaleDateString('de-DE')}` : 'unverifiziert'
      zeilen.push(`## ${e.name} (${e.typ})`)
      zeilen.push(`- Kategorie: ${e.kategorie}`)
      zeilen.push(`- Quelle: ${e.quelle.werk}${e.quelle.unsicher ? ' (Kapitelangabe unsicher)' : ''}`)
      if (e.richtwert) zeilen.push('- Richtwert/Orientierung')
      zeilen.push(`- Status: ${status}`)
      if (v?.notiz) zeilen.push(`- Notiz: ${v.notiz}`)
      zeilen.push('')
    }
    const blob = new Blob([zeilen.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rechenwerk-pruefliste-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBar value={suche} onChange={setSuche} placeholder="Formel oder Tabelle suchen…" />

      <div className="flex flex-col gap-1.5 rounded-2xl bg-white p-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-stone-500">Fortschritt</span>
          <span className="font-medium tabular-nums text-stone-700">
            {verifizierteAnzahl} / {eintraege.length} verifiziert
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-paper-200">
          <div
            className="h-full rounded-full bg-accent-600"
            style={{ width: `${(verifizierteAnzahl / eintraege.length) * 100}%` }}
          />
        </div>
      </div>

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        optionen={[
          { value: 'alle', label: 'Alle' },
          { value: 'unverifiziert', label: 'Unverifiziert' },
          { value: 'richtwert', label: 'Richtwert' },
          { value: 'verifiziert', label: 'Verifiziert' },
        ]}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        <button
          onClick={() => setKategorie(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
            kategorie === null ? 'bg-accent-600 text-white' : 'bg-paper-200 text-stone-600'
          }`}
        >
          Alle Kategorien
        </button>
        {kategorien.map((k) => (
          <button
            key={k}
            onClick={() => setKategorie(k)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
              kategorie === k ? 'bg-accent-600 text-white' : 'bg-paper-200 text-stone-600'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <button
        onClick={exportMarkdown}
        className="flex items-center justify-center gap-1.5 self-start rounded-xl bg-paper-200 px-3 py-2 text-[13px] font-medium text-stone-700"
      >
        <Download size={14} />
        Prüfliste exportieren
      </button>

      {gefiltert.length === 0 && <EmptyState icon={Info} text="Keine Einträge entsprechen den Filtern." />}

      <div className="flex flex-col gap-2">
        {gefiltert.map((e) => (
          <div key={e.id} className="flex flex-col gap-2 rounded-2xl bg-white p-3.5">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => e.typ === 'Formel' && navigiere({ name: 'formel', id: e.id })}
                disabled={e.typ !== 'Formel'}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[17px] font-medium text-stone-900">{e.name}</p>
                <p className="truncate text-[13px] text-stone-500">
                  {e.typ} · {e.kategorie}
                </p>
              </button>
              {e.typ === 'Formel' && (
                <button onClick={() => toggeln(e.id)} aria-label="Favorit umschalten" className="shrink-0 p-1 text-stone-400">
                  <Star size={18} className={istFavorit(e.id) ? 'fill-amber-500 text-amber-500' : ''} />
                </button>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-stone-600">
              {e.quelle.werk}
              {e.quelle.unsicher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  <Info size={11} />
                  Kapitelangabe unsicher
                </span>
              )}
              {e.richtwert && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  <Gauge size={11} />
                  Richtwert
                </span>
              )}
            </p>
            <VerificationBadge
              verifizierung={verifizierungen[e.id]}
              richtwert={e.richtwert}
              onSetzen={(v, notiz) => setzen(e.id, v, notiz)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
