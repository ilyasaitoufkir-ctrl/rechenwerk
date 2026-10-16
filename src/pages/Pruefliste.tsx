import { useMemo, useState } from 'react'
import { Download, Info } from 'lucide-react'
import { alleFormeln } from '../formulas/registry'
import { alleDatenTabellen } from '../data/registry'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { VerificationBadge } from '../components/VerificationBadge'
import type { Quelle } from '../types/formula'

interface PruflisteEintrag {
  id: string
  name: string
  kategorie: string
  typ: 'Formel' | 'Tabelle'
  quelle: Quelle
  richtwert?: boolean
}

function buildEintraege(): PruflisteEintrag[] {
  const formeln: PruflisteEintrag[] = alleFormeln.map((f) => ({
    id: f.id,
    name: f.name,
    kategorie: f.kategorie,
    typ: 'Formel',
    quelle: f.quelle,
    richtwert: f.richtwert,
  }))
  const tabellen: PruflisteEintrag[] = alleDatenTabellen.map((t) => ({
    id: t.id,
    name: t.name,
    kategorie: t.kategorie,
    typ: 'Tabelle',
    quelle: t.quelle,
    richtwert: true,
  }))
  return [...formeln, ...tabellen]
}

type Filter = 'alle' | 'unsicher' | 'richtwert' | 'unverifiziert' | 'verifiziert'

export function Pruefliste() {
  const eintraege = useMemo(() => buildEintraege(), [])
  const { verifizierungen, setzen } = useVerifizierung()
  const [filter, setFilter] = useState<Filter>('alle')

  const verifizierteAnzahl = eintraege.filter((e) => verifizierungen[e.id]?.verifiziert).length

  const gefiltert = eintraege.filter((e) => {
    if (filter === 'unsicher') return e.quelle.unsicher
    if (filter === 'richtwert') return e.richtwert
    if (filter === 'unverifiziert') return !verifizierungen[e.id]?.verifiziert
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Prüfliste</h1>
        <button
          onClick={exportMarkdown}
          className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-paper-300 bg-white p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600 dark:text-stone-400">Fortschritt</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {verifizierteAnzahl} von {eintraege.length} verifiziert
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-sage-500"
            style={{ width: `${(verifizierteAnzahl / eintraege.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['alle', 'Alle'],
            ['unsicher', 'Unsichere Quelle'],
            ['richtwert', 'Richtwert'],
            ['unverifiziert', 'Unverifiziert'],
            ['verifiziert', 'Verifiziert'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === key
                ? 'bg-accent-600 text-white'
                : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {gefiltert.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
            Keine Einträge entsprechen dem Filter.
          </p>
        )}
        {gefiltert.map((e) => (
          <div
            key={e.id}
            className="flex flex-col gap-2 rounded-xl border border-paper-300 bg-white p-3 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-100">{e.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {e.typ} · {e.kategorie}
                </p>
              </div>
            </div>
            <p className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              {e.quelle.werk}
              {e.quelle.unsicher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <Info size={12} />
                  Kapitelangabe unsicher
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
