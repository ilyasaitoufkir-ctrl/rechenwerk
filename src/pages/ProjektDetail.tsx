import { useEffect, useState } from 'react'
import { Camera, Plus, Printer, Trash2, ArrowRight, BadgeCheck, Gauge } from 'lucide-react'
import {
  getProjekt,
  projektNotizHinzufuegen,
  projektNotizEntfernen,
  projektBerechnungEntfernen,
  projektFotoHinzufuegen,
  projektFotoEntfernen,
  projektLoeschen,
  setLetzteEingaben,
  type Projekt,
} from '../lib/storage'
import { fotoSpeichern, fotoLoeschen, fotosFuerProjekt, type FotoEintrag } from '../lib/idb'
import { bildVerarbeiten } from '../lib/bildverarbeitung'
import { getFormel } from '../formulas/registry'
import { fromSI } from '../units'
import { formatNumber } from '../lib/format'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import { EmptyState } from '../components/EmptyState'

export function ProjektDetail({ id }: { id: string }) {
  const [projekt, setProjekt] = useState<Projekt | undefined>(() => getProjekt(id))
  useSetHeaderTitle(projekt?.name ?? 'Projekt')
  const [fotos, setFotos] = useState<FotoEintrag[]>([])
  const [notizText, setNotizText] = useState('')

  useEffect(() => {
    fotosFuerProjekt(id)
      .then(setFotos)
      .catch(() => setFotos([]))
  }, [id, projekt?.fotoIds.length])

  if (!projekt) {
    return <EmptyState icon={Trash2} text="Projekt wurde nicht gefunden - vielleicht gelöscht." />
  }

  async function fotoHinzufuegen(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return
    const verarbeitet = await bildVerarbeiten(datei, 1600)
    const fotoId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await fotoSpeichern({ id: fotoId, dataUrl: verarbeitet.dataUrl, projektId: id, kontext: 'projekt', erstelltAm: Date.now() })
    const neue = projektFotoHinzufuegen(id, fotoId)
    setProjekt(neue.find((p) => p.id === id))
  }

  async function fotoWegnehmen(fotoId: string) {
    await fotoLoeschen(fotoId)
    const neue = projektFotoEntfernen(id, fotoId)
    setProjekt(neue.find((p) => p.id === id))
  }

  function notizSpeichern() {
    if (!notizText.trim()) return
    const neue = projektNotizHinzufuegen(id, notizText.trim())
    setProjekt(neue.find((p) => p.id === id))
    setNotizText('')
  }

  function notizWegnehmen(notizId: string) {
    const neue = projektNotizEntfernen(id, notizId)
    setProjekt(neue.find((p) => p.id === id))
  }

  function berechnungWegnehmen(berechnungId: string) {
    const neue = projektBerechnungEntfernen(id, berechnungId)
    setProjekt(neue.find((p) => p.id === id))
  }

  function imRechnerOeffnen(berechnungId: string) {
    const b = projekt!.berechnungen.find((x) => x.id === berechnungId)
    if (!b) return
    const formel = getFormel(b.formelId)
    if (!formel) return
    const ausgabeIds = new Set([b.ziel, ...(formel.zusatzAusgaben ?? [])])
    const werte: Record<string, string> = {}
    const einheiten: Record<string, string> = {}
    for (const v of formel.variablen) {
      if (ausgabeIds.has(v.id) || b.bekannt[v.id] === undefined) continue
      werte[v.id] = String(fromSI(b.bekannt[v.id], v.dimension, v.defaultUnit))
      einheiten[v.id] = v.defaultUnit
    }
    setLetzteEingaben(formel.id, { ziel: b.ziel, werte, einheiten })
    navigiere({ name: 'formel', id: formel.id })
  }

  function projektLoeschenUndZurueck() {
    projektLoeschen(id)
    navigiere({ name: 'projekte' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex items-center gap-2">
        <button
          onClick={() => window.print()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink"
        >
          <Printer size={16} />
          Als PDF / drucken
        </button>
        <button onClick={projektLoeschenUndZurueck} className="rounded-xl bg-red-100 p-2.5 text-red-800" aria-label="Projekt löschen">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="druckbericht flex flex-col gap-6">
        <div>
          <h1 className="text-[22px] font-bold text-stone-900">{projekt.name}</h1>
          {projekt.beschreibung && <p className="text-[14px] text-stone-500">{projekt.beschreibung}</p>}
        </div>

        <section className="flex flex-col gap-2">
          <span className="eyebrow">Notizen</span>
          <div className="no-print flex gap-2">
            <input
              value={notizText}
              onChange={(e) => setNotizText(e.target.value)}
              placeholder="Notiz hinzufügen..."
              className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
            />
            <button onClick={notizSpeichern} className="shrink-0 rounded-lg bg-accent-600 px-3 py-2 text-[13px] font-medium text-ink">
              <Plus size={16} />
            </button>
          </div>
          {projekt.notizen.length === 0 ? (
            <p className="text-[13px] text-stone-500">Keine Notizen.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {projekt.notizen.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-2 rounded-xl bg-paper-200 p-2.5 text-[14px] text-stone-800">
                  <span className="min-w-0 flex-1">{n.text}</span>
                  <button onClick={() => notizWegnehmen(n.id)} className="no-print shrink-0 text-stone-400" aria-label="Notiz löschen">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="no-print flex flex-col gap-2">
          <span className="eyebrow">Fotos</span>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-paper-200 text-stone-400">
              <Camera size={20} />
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void fotoHinzufuegen(e)} />
            </label>
            {fotos.map((f) => (
              <div key={f.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <img src={f.dataUrl} alt="Projektfoto" className="h-full w-full object-cover" />
                <button
                  onClick={() => void fotoWegnehmen(f.id)}
                  aria-label="Foto löschen"
                  className="absolute right-1 top-1 rounded-full bg-paper-50/80 p-1 text-stone-900"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="eyebrow">Berechnungen</span>
          {projekt.berechnungen.length === 0 ? (
            <p className="text-[13px] text-stone-500">
              Noch keine Berechnungen. Füge welche über „Zu Projekt hinzufügen“ im Rechner oder im Verlauf hinzu.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {projekt.berechnungen.map((b) => {
                const formel = getFormel(b.formelId)
                const zielVar = formel?.variablen.find((v) => v.id === b.ziel)
                const wert = zielVar ? fromSI(b.ergebnis[b.ziel], zielVar.dimension, zielVar.defaultUnit) : undefined
                return (
                  <div key={b.id} className="flex flex-col gap-1.5 rounded-2xl bg-paper-200 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[16px] font-medium text-stone-900">{b.formelName}</p>
                        <p className="text-[12px] text-stone-500">{b.kategorie}</p>
                      </div>
                      <button onClick={() => berechnungWegnehmen(b.id)} className="no-print shrink-0 text-stone-400" aria-label="Berechnung entfernen">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {zielVar && wert !== undefined && (
                      <p className="text-[18px] font-semibold tabular-nums text-stone-900">
                        {zielVar.name} = {formatNumber(wert, 4)} {zielVar.defaultUnit}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {b.richtwert && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          <Gauge size={11} />
                          Richtwert
                        </span>
                      )}
                      {b.verifiziert && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-800">
                          <BadgeCheck size={11} />
                          Verifiziert
                        </span>
                      )}
                      <span className="text-[11px] text-stone-500">{b.quelle.werk}</span>
                    </div>
                    <p className="text-[11px] text-stone-500">{new Date(b.zeitpunkt).toLocaleString('de-DE')}</p>
                    <button
                      onClick={() => imRechnerOeffnen(b.id)}
                      className="no-print mt-1 flex items-center justify-center gap-1.5 self-start rounded-lg bg-accent-100 px-3 py-1.5 text-[12px] font-medium text-accent-700"
                    >
                      Im Rechner öffnen
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
