import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Info, Star } from 'lucide-react'
import type { Formula, Variable } from '../types/formula'
import { toSI } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { getLetzteEingaben, setLetzteEingaben, verlaufEintragHinzufuegen } from '../lib/storage'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { useFavoriten } from '../hooks/useFavoriten'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useTransfer } from '../hooks/useTransfer'
import { FeldEingabe } from './FeldEingabe'
import { ResultDisplay } from './ResultDisplay'
import { WarningBanner } from './WarningBanner'
import { VerificationBadge } from './VerificationBadge'
import { KatexBlock } from './KatexBlock'

interface GespeicherterZustand {
  ziel?: string
  werte?: Record<string, string>
  einheiten?: Record<string, string>
}

function variableById(formel: Formula, id: string): Variable {
  const v = formel.variablen.find((x) => x.id === id)
  if (!v) throw new Error(`Variable "${id}" nicht in Formel "${formel.id}" definiert`)
  return v
}

export function Calculator({ formel }: { formel: Formula }) {
  const gespeichert = useMemo<GespeicherterZustand>(
    () => (getLetzteEingaben(formel.id) as GespeicherterZustand) ?? {},
    [formel.id],
  )

  const [ziel, setZiel] = useState<string>(
    gespeichert.ziel && formel.zielgroessen.includes(gespeichert.ziel)
      ? gespeichert.ziel
      : formel.zielgroessen[0],
  )
  const [werte, setWerte] = useState<Record<string, string>>(gespeichert.werte ?? {})
  const [einheiten, setEinheiten] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...gespeichert.einheiten }
    for (const v of formel.variablen) {
      if (!initial[v.id]) initial[v.id] = v.defaultUnit
    }
    return initial
  })
  const [rechenwegOffen, setRechenwegOffen] = useState(false)

  const { verifizierungen, setzen } = useVerifizierung()
  const { favoriten, toggeln } = useFavoriten()
  const { signifikanteStellen } = useEinstellungen()
  const { transfer, setTransfer } = useTransfer()

  const ausgabeIds = useMemo(
    () => new Set([ziel, ...(formel.zusatzAusgaben ?? [])]),
    [ziel, formel.zusatzAusgaben],
  )
  const eingabeVariablen = formel.variablen.filter((v) => !ausgabeIds.has(v.id))
  const ausgabeVariablen = formel.variablen.filter((v) => ausgabeIds.has(v.id))

  useEffect(() => {
    setLetzteEingaben(formel.id, { ziel, werte, einheiten })
  }, [formel.id, ziel, werte, einheiten])

  const parsedWerte: Record<string, { wert: number; fehler?: string }> = {}
  for (const v of eingabeVariablen) {
    const text = werte[v.id] ?? ''
    if (text.trim() === '') {
      parsedWerte[v.id] = { wert: NaN, fehler: undefined }
      continue
    }
    const zahl = parseDecimal(text)
    if (zahl === null) {
      parsedWerte[v.id] = { wert: NaN, fehler: 'Ungültige Zahl' }
    } else if (v.min !== undefined && zahl < v.min) {
      parsedWerte[v.id] = { wert: zahl, fehler: `Muss ≥ ${v.min} sein` }
    } else if (v.max !== undefined && zahl > v.max) {
      parsedWerte[v.id] = { wert: zahl, fehler: `Muss ≤ ${v.max} sein` }
    } else {
      parsedWerte[v.id] = { wert: zahl }
    }
  }

  const alleAusgefuellt = eingabeVariablen.every((v) => (werte[v.id] ?? '').trim() !== '')
  const hatFehler = Object.values(parsedWerte).some((p) => p.fehler)

  let ergebnis: Record<string, number> | null = null
  let rechenFehler: string | null = null
  let bekanntSI: Record<string, number> = {}

  if (alleAusgefuellt && !hatFehler) {
    try {
      bekanntSI = {}
      for (const v of eingabeVariablen) {
        bekanntSI[v.id] = toSI(parsedWerte[v.id].wert, v.dimension, einheiten[v.id] ?? v.defaultUnit)
      }
      const roh = formel.compute(bekanntSI, ziel)
      const nichtEndlich = Object.values(roh).some((x) => !Number.isFinite(x))
      if (nichtEndlich) {
        rechenFehler = 'Ergebnis ist nicht definiert (z. B. Division durch 0 oder Wert außerhalb des gültigen Bereichs).'
      } else {
        ergebnis = roh
      }
    } catch (e) {
      rechenFehler = e instanceof Error ? e.message : 'Unbekannter Fehler bei der Berechnung.'
    }
  }

  const warnungen = ergebnis ? formel.warnungen?.(bekanntSI, ziel, ergebnis) ?? [] : []
  const empfehlung = ergebnis ? formel.empfehlung?.(ergebnis) : undefined

  const bekanntSIKey = JSON.stringify(bekanntSI)
  useEffect(() => {
    if (!ergebnis) return
    const timeout = setTimeout(() => {
      verlaufEintragHinzufuegen({
        formelId: formel.id,
        formelName: formel.name,
        bekannt: bekanntSI,
        ziel,
        ergebnis,
      })
    }, 900)
    return () => clearTimeout(timeout)
    // Protokolliert bewusst erst nach kurzer Pause, nicht bei jedem Tastendruck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bekanntSIKey, ziel])

  const istFav = favoriten.includes(formel.id)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{formel.name}</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{formel.kategorie}</p>
        </div>
        <button
          onClick={() => toggeln(formel.id)}
          aria-label="Favorit umschalten"
          className="rounded-lg p-2 text-stone-400 hover:bg-paper-100 dark:hover:bg-white/10"
        >
          <Star size={22} className={istFav ? 'fill-amber-400 text-amber-500' : ''} />
        </button>
      </div>

      <VerificationBadge
        verifizierung={verifizierungen[formel.id]}
        richtwert={formel.richtwert}
        onSetzen={(v, notiz) => setzen(formel.id, v, notiz)}
      />

      <KatexBlock latex={formel.latex} />

      {formel.zielgroessen.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Berechnen:</span>
          <div className="flex flex-wrap gap-2">
            {formel.zielgroessen.map((zId) => {
              const v = variableById(formel, zId)
              return (
                <button
                  key={zId}
                  onClick={() => setZiel(zId)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    ziel === zId
                      ? 'bg-accent-600 text-white'
                      : 'bg-paper-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
                  }`}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {eingabeVariablen.map((v) => {
          const vorschlag =
            transfer && transfer.dimension === v.dimension
              ? {
                  label: `Einfügen: ${formatNumber(transfer.wertSI, signifikanteStellen)} (${transfer.herkunft})`,
                  onClick: () => {
                    setEinheiten((e) => ({ ...e, [v.id]: v.defaultUnit }))
                    setWerte((w) => ({
                      ...w,
                      [v.id]: formatNumber(transfer.wertSI, 10).replace('.', ','),
                    }))
                  },
                }
              : undefined
          return (
            <FeldEingabe
              key={v.id}
              variable={v}
              wert={werte[v.id] ?? ''}
              einheit={einheiten[v.id] ?? v.defaultUnit}
              onWertChange={(wert) => setWerte((w) => ({ ...w, [v.id]: wert }))}
              onEinheitChange={(e) => setEinheiten((eh) => ({ ...eh, [v.id]: e }))}
              fehler={parsedWerte[v.id]?.fehler}
              einfuegenVorschlag={vorschlag}
            />
          )
        })}
      </div>

      {rechenFehler && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          Kein Ergebnis: {rechenFehler}
        </div>
      )}

      {!alleAusgefuellt && !rechenFehler && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Bitte alle Werte eingeben, um das Ergebnis zu berechnen.
        </p>
      )}

      {ergebnis &&
        ausgabeVariablen.map((v) => (
          <ResultDisplay
            key={v.id}
            variable={v}
            wertSI={ergebnis![v.id]}
            einheit={einheiten[v.id] ?? v.defaultUnit}
            onEinheitChange={(e) => setEinheiten((eh) => ({ ...eh, [v.id]: e }))}
            signifikanteStellen={signifikanteStellen}
            gross={v.id === ziel}
            onUebernehmen={() =>
              setTransfer({
                dimension: v.dimension,
                wertSI: ergebnis![v.id],
                herkunft: `${formel.name}`,
              })
            }
          />
        ))}

      {empfehlung && <WarningBanner nachrichten={[empfehlung]} variante="info" />}
      {warnungen.length > 0 && <WarningBanner nachrichten={warnungen} />}

      <button
        onClick={() => setRechenwegOffen((o) => !o)}
        className="flex items-center justify-between rounded-xl border border-paper-300 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-200"
      >
        Formel, Rechenweg, Gültigkeit &amp; Quelle
        <ChevronDown
          size={18}
          className={`transition-transform ${rechenwegOffen ? 'rotate-180' : ''}`}
        />
      </button>

      {rechenwegOffen && (
        <div className="flex flex-col gap-4 rounded-xl border border-paper-300 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
          <section>
            <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Eingesetzte Werte</h2>
            {ergebnis ? (
              <ul className="flex flex-col gap-1">
                {eingabeVariablen.map((v) => (
                  <li key={v.id} className="flex justify-between gap-2 text-stone-600 dark:text-stone-400">
                    <span>{v.name}</span>
                    <span className="tabular-nums">
                      {werte[v.id]} {einheiten[v.id]}
                    </span>
                  </li>
                ))}
                {ausgabeVariablen.map((v) => (
                  <li
                    key={v.id}
                    className="flex justify-between gap-2 border-t border-paper-200 pt-1 font-medium text-stone-800 dark:border-white/10 dark:text-stone-200"
                  >
                    <span>{v.name}</span>
                    <span className="tabular-nums">
                      {formatNumber(ergebnis![v.id], signifikanteStellen)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500 dark:text-stone-400">Noch kein vollständiges Ergebnis.</p>
            )}
          </section>

          <section>
            <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Gültigkeitsbereich</h2>
            <p className="text-stone-600 dark:text-stone-400">{formel.gueltigkeit}</p>
          </section>

          {formel.annahmen.length > 0 && (
            <section>
              <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Annahmen</h2>
              <ul className="list-inside list-disc text-stone-600 dark:text-stone-400">
                {formel.annahmen.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-1 font-semibold text-stone-800 dark:text-stone-200">Quelle</h2>
            <p className="flex flex-wrap items-center gap-2 text-stone-600 dark:text-stone-400">
              {formel.quelle.werk}
              {formel.quelle.auflage ? `, ${formel.quelle.auflage}` : ''}
              {formel.quelle.kapitel ? `, ${formel.quelle.kapitel}` : ''}
              {formel.quelle.unsicher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <Info size={12} />
                  Kapitelangabe unsicher
                </span>
              )}
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
