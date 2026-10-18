import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Info, Star, FolderPlus, AlertTriangle } from 'lucide-react'
import type { Formula, Variable } from '../types/formula'
import { toSI, fromSI } from '../units'
import { parseDecimal, formatNumber } from '../lib/format'
import { getLetzteEingaben, setLetzteEingaben, verlaufEintragHinzufuegen } from '../lib/storage'
import type { ProjektBerechnung } from '../lib/storage'
import { loeseNachVariable, benoetigteEingaben, type AufloesungsErgebnis } from '../lib/loeser'
import { useVerifizierung } from '../hooks/useVerifizierung'
import { useFavoriten } from '../hooks/useFavoriten'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useTransfer } from '../hooks/useTransfer'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { KATEGORIE_BILD } from '../lib/kategorieBilder'
import { FeldEingabe } from './FeldEingabe'
import { SchichtenEingabe } from './SchichtenEingabe'
import { KomponentenEingabe } from './KomponentenEingabe'
import { ResultDisplay } from './ResultDisplay'
import { WarningBanner } from './WarningBanner'
import { VerificationBadge } from './VerificationBadge'
import { KatexBlock } from './KatexBlock'
import { DruckgeraeteBanner } from './DruckgeraeteBanner'
import { KategorieBild } from './KategorieBild'
import { ZuProjektHinzufuegenSheet } from './ZuProjektHinzufuegenSheet'
import { GesuchtAuswahlSheet } from './GesuchtAuswahlSheet'
import { ParameterstudieSheet } from './ParameterstudieSheet'
import { VariantenVergleich } from './VariantenVergleich'

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
  useSetHeaderTitle(formel.name)
  const gespeichert = useMemo<GespeicherterZustand>(
    () => (getLetzteEingaben(formel.id) as GespeicherterZustand) ?? {},
    [formel.id],
  )

  const kannBeliebigAufloesen = !formel.schichtfeld && !formel.komponentenfeld

  const [gesucht, setGesucht] = useState<string>(
    gespeichert.ziel && formel.variablen.some((v) => v.id === gespeichert.ziel)
      ? gespeichert.ziel
      : formel.zielgroessen[0],
  )
  const [gesuchtSheetOffen, setGesuchtSheetOffen] = useState(false)
  const istAnalytisch = formel.zielgroessen.includes(gesucht)
  const ziel = istAnalytisch ? gesucht : formel.zielgroessen[0]

  const [werte, setWerte] = useState<Record<string, string>>(gespeichert.werte ?? {})
  const [einheiten, setEinheiten] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...gespeichert.einheiten }
    for (const v of formel.variablen) {
      if (!initial[v.id]) initial[v.id] = v.defaultUnit
    }
    return initial
  })
  const [rechenwegOffen, setRechenwegOffen] = useState(false)
  const [projektSheetOffen, setProjektSheetOffen] = useState(false)
  const [schichtSumme, setSchichtSumme] = useState<number | null>(null)
  const schichtVariableId = formel.schichtfeld?.zielVariable
  const [komponentenSummen, setKomponentenSummen] = useState<Record<string, number> | null>(null)
  const komponentenVariableIds = useMemo(
    () => new Set(formel.komponentenfeld?.summen.map((s) => s.zielVariable) ?? []),
    [formel.komponentenfeld],
  )

  const { verifizierungen, setzen } = useVerifizierung()
  const { favoriten, toggeln } = useFavoriten()
  const { signifikanteStellen } = useEinstellungen()
  const { transfer, setTransfer } = useTransfer()

  const ausgabeIds = useMemo(
    () => new Set([ziel, ...(formel.zusatzAusgaben ?? [])]),
    [ziel, formel.zusatzAusgaben],
  )
  const eingabeVariablen = istAnalytisch
    ? formel.variablen.filter((v) => !ausgabeIds.has(v.id))
    : benoetigteEingaben(formel, gesucht).map((id) => variableById(formel, id))
  const ausgabeVariablen = istAnalytisch ? formel.variablen.filter((v) => ausgabeIds.has(v.id)) : []
  const gesuchtVariable = variableById(formel, gesucht)

  useEffect(() => {
    setLetzteEingaben(formel.id, { ziel: gesucht, werte, einheiten })
  }, [formel.id, gesucht, werte, einheiten])

  const parsedWerte: Record<string, { wert: number; fehler?: string }> = {}
  for (const v of eingabeVariablen) {
    if (v.id === schichtVariableId) continue // eigene Eingabe über SchichtenEingabe
    if (komponentenVariableIds.has(v.id)) continue // eigene Eingabe über KomponentenEingabe
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

  const alleAusgefuellt =
    eingabeVariablen
      .filter((v) => v.id !== schichtVariableId && !komponentenVariableIds.has(v.id))
      .every((v) => (werte[v.id] ?? '').trim() !== '') &&
    (!schichtVariableId || schichtSumme !== null) &&
    (komponentenVariableIds.size === 0 || komponentenSummen !== null)
  const hatFehler = Object.values(parsedWerte).some((p) => p.fehler)

  let ergebnis: Record<string, number> | null = null
  let rechenFehler: string | null = null
  let bekanntSI: Record<string, number> = {}
  let aufloesung: AufloesungsErgebnis | null = null

  if (alleAusgefuellt && !hatFehler) {
    try {
      bekanntSI = {}
      for (const v of eingabeVariablen) {
        if (v.id === schichtVariableId) {
          bekanntSI[v.id] = schichtSumme!
        } else if (komponentenVariableIds.has(v.id)) {
          bekanntSI[v.id] = komponentenSummen![v.id]
        } else {
          bekanntSI[v.id] = toSI(parsedWerte[v.id].wert, v.dimension, einheiten[v.id] ?? v.defaultUnit)
        }
      }
      if (istAnalytisch) {
        const roh = formel.compute(bekanntSI, ziel)
        const nichtEndlich = Object.values(roh).some((x) => !Number.isFinite(x))
        if (nichtEndlich) {
          rechenFehler = 'Ergebnis ist nicht definiert (z. B. Division durch 0 oder Wert außerhalb des gültigen Bereichs).'
        } else {
          ergebnis = roh
        }
      } else {
        aufloesung = loeseNachVariable(formel, gesucht, bekanntSI)
        if (aufloesung.fehler && aufloesung.kandidaten.length === 0) {
          rechenFehler = aufloesung.fehler
        }
      }
    } catch (e) {
      rechenFehler = e instanceof Error ? e.message : 'Unbekannter Fehler bei der Berechnung.'
    }
  }

  const eindeutigerKandidat = aufloesung && aufloesung.kandidaten.length === 1 ? aufloesung.kandidaten[0] : null
  const warnungen = ergebnis
    ? formel.warnungen?.(bekanntSI, ziel, ergebnis) ?? []
    : eindeutigerKandidat?.warnungen ?? []
  const empfehlung = ergebnis ? formel.empfehlung?.(ergebnis) : undefined

  const projektBerechnung: Omit<ProjektBerechnung, 'id'> | null = ergebnis
    ? {
        formelId: formel.id,
        formelName: formel.name,
        kategorie: formel.kategorie,
        bekannt: bekanntSI,
        ziel,
        ergebnis,
        quelle: formel.quelle,
        verifiziert: verifizierungen[formel.id]?.verifiziert ?? false,
        richtwert: formel.richtwert ?? false,
        zeitpunkt: Date.now(),
      }
    : eindeutigerKandidat
      ? {
          formelId: formel.id,
          formelName: formel.name,
          kategorie: formel.kategorie,
          bekannt: { ...bekanntSI, [gesucht]: eindeutigerKandidat.wert },
          ziel: gesucht,
          ergebnis: { [gesucht]: eindeutigerKandidat.wert },
          quelle: formel.quelle,
          verifiziert: verifizierungen[formel.id]?.verifiziert ?? false,
          richtwert: formel.richtwert ?? false,
          zeitpunkt: Date.now(),
        }
      : null

  const bekanntSIKey = JSON.stringify(bekanntSI)
  useEffect(() => {
    if (!ergebnis && !eindeutigerKandidat) return
    const timeout = setTimeout(() => {
      verlaufEintragHinzufuegen(
        ergebnis
          ? { formelId: formel.id, formelName: formel.name, bekannt: bekanntSI, ziel, ergebnis }
          : {
              formelId: formel.id,
              formelName: formel.name,
              bekannt: { ...bekanntSI, [gesucht]: eindeutigerKandidat!.wert },
              ziel: gesucht,
              ergebnis: { [gesucht]: eindeutigerKandidat!.wert },
            },
      )
    }, 900)
    return () => clearTimeout(timeout)
    // Protokolliert bewusst erst nach kurzer Pause, nicht bei jedem Tastendruck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bekanntSIKey, ziel])

  const istFav = favoriten.includes(formel.id)
  const bildSlug = KATEGORIE_BILD[formel.kategorie]

  return (
    <div className="flex flex-col gap-5">
      {bildSlug && (
        <div className="relative -mx-4 -mt-2 h-[140px] w-auto">
          <KategorieBild slug={bildSlug} alt={formel.kategorie} className="absolute inset-0 h-full w-full" />
          <button
            onClick={() => toggeln(formel.id)}
            aria-label="Favorit umschalten"
            className="absolute right-3 top-3 rounded-lg bg-paper-50/60 p-1.5"
          >
            <Star size={20} className={istFav ? 'fill-amber-500 text-amber-500' : 'text-stone-900'} />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="eyebrow">{formel.kategorie}</span>
            <p className="text-[22px] font-bold text-stone-900">{formel.name}</p>
          </div>
        </div>
      )}

      {!bildSlug && (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[22px] font-bold text-stone-900">{formel.name}</p>
            <p className="text-[13px] text-stone-500">{formel.kategorie}</p>
          </div>
          <button
            onClick={() => toggeln(formel.id)}
            aria-label="Favorit umschalten"
            className="rounded-lg p-2 text-stone-400"
          >
            <Star size={22} className={istFav ? 'fill-amber-500 text-amber-500' : ''} />
          </button>
        </div>
      )}

      {formel.kategorie === 'Druckgeräte' && <DruckgeraeteBanner />}

      <VerificationBadge
        verifizierung={verifizierungen[formel.id]}
        richtwert={formel.richtwert}
        onSetzen={(v, notiz) => setzen(formel.id, v, notiz)}
      />

      <KatexBlock latex={formel.latex} />

      {kannBeliebigAufloesen && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-stone-500">Gesucht</span>
          <button
            onClick={() => setGesuchtSheetOffen(true)}
            className="flex items-center justify-between rounded-xl bg-paper-200 px-3.5 py-2.5 text-left"
          >
            <span className="text-[15px] font-medium text-stone-900">{gesuchtVariable.name}</span>
            <ChevronDown size={16} className="text-stone-400" />
          </button>
          {!istAnalytisch && (
            <p className="flex items-center gap-1.5 text-[12px] text-stone-500">
              <AlertTriangle size={13} className="shrink-0 text-amber-600" />
              Wird numerisch aufgelöst (keine fertige Umkehrformel in der Bibliothek).
            </p>
          )}
        </div>
      )}
      <GesuchtAuswahlSheet
        offen={gesuchtSheetOffen}
        onClose={() => setGesuchtSheetOffen(false)}
        formel={formel}
        gesucht={gesucht}
        onSelect={setGesucht}
      />

      <div className="flex flex-col gap-4">
        {eingabeVariablen.map((v) => {
          if (v.id === schichtVariableId && formel.schichtfeld) {
            return (
              <SchichtenEingabe
                key={v.id}
                feld={formel.schichtfeld}
                name={v.name}
                onSummeChange={setSchichtSumme}
              />
            )
          }
          if (komponentenVariableIds.has(v.id)) return null // einmalig unten gerendert
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
        {formel.komponentenfeld && (
          <KomponentenEingabe feld={formel.komponentenfeld} onSummenChange={setKomponentenSummen} />
        )}
      </div>

      {rechenFehler && (
        <div className="rounded-xl bg-red-50 p-3 text-[14px] text-red-800">Kein Ergebnis: {rechenFehler}</div>
      )}

      {!alleAusgefuellt && !rechenFehler && (
        <p className="text-[14px] text-stone-500">Bitte alle Werte eingeben, um das Ergebnis zu berechnen.</p>
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

      {eindeutigerKandidat && (
        <ResultDisplay
          variable={gesuchtVariable}
          wertSI={eindeutigerKandidat.wert}
          einheit={einheiten[gesucht] ?? gesuchtVariable.defaultUnit}
          onEinheitChange={(e) => setEinheiten((eh) => ({ ...eh, [gesucht]: e }))}
          signifikanteStellen={signifikanteStellen}
          gross
          onUebernehmen={() => setTransfer({ dimension: gesuchtVariable.dimension, wertSI: eindeutigerKandidat.wert, herkunft: formel.name })}
        />
      )}

      {aufloesung && aufloesung.kandidaten.length > 1 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-900">
            <AlertTriangle size={15} />
            Mehrdeutigkeit: {aufloesung.kandidaten.length} mögliche Lösungen gefunden
          </p>
          {aufloesung.kandidaten.map((k, i) => (
            <div key={i} className="rounded-xl bg-paper-50 p-2.5">
              <p className="tabular-nums text-[18px] font-semibold text-stone-900">
                {formatNumber(fromSI(k.wert, gesuchtVariable.dimension, einheiten[gesucht] ?? gesuchtVariable.defaultUnit), signifikanteStellen)}{' '}
                <span className="text-[13px] font-normal text-stone-500">{einheiten[gesucht] ?? gesuchtVariable.defaultUnit}</span>
              </p>
              {!k.gueltig && <p className="text-[12px] text-amber-800">Außerhalb des an der Größe hinterlegten Gültigkeitsbereichs.</p>}
              {k.warnungen.map((w, j) => (
                <p key={j} className="text-[12px] text-amber-800">
                  {w}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {empfehlung && <WarningBanner nachrichten={[empfehlung]} variante="info" />}
      {warnungen.length > 0 && <WarningBanner nachrichten={warnungen} />}

      {(ergebnis || eindeutigerKandidat) && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setProjektSheetOffen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-paper-200 px-4 py-2.5 text-[14px] font-medium text-stone-700"
          >
            <FolderPlus size={16} />
            Zu Projekt hinzufügen
          </button>
          {istAnalytisch && (
            <>
              <ParameterstudieSheet
                formel={formel}
                ziel={ziel}
                eingabeVariablen={eingabeVariablen}
                werte={werte}
                einheiten={einheiten}
                ausgabeVariablen={ausgabeVariablen}
              />
              <VariantenVergleich
                formel={formel}
                ziel={ziel}
                eingabeVariablen={eingabeVariablen}
                werte={werte}
                einheiten={einheiten}
                ergebnisSI={ergebnis}
              />
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setRechenwegOffen((o) => !o)}
        className="flex items-center justify-between rounded-2xl bg-paper-200 px-4 py-3 text-left text-[15px] font-medium text-stone-700"
      >
        Formel, Rechenweg, Gültigkeit &amp; Quelle
        <ChevronDown size={18} className={`transition-transform ${rechenwegOffen ? 'rotate-180' : ''}`} />
      </button>

      {rechenwegOffen && (
        <div className="flex flex-col gap-4 rounded-2xl bg-paper-200 p-4 text-[14px]">
          <section>
            <h2 className="mb-1 font-semibold text-stone-800">Eingesetzte Werte</h2>
            {ergebnis || eindeutigerKandidat ? (
              <ul className="flex flex-col gap-1">
                {eingabeVariablen.map((v) => (
                  <li key={v.id} className="flex justify-between gap-2 text-stone-600">
                    <span>{v.name}</span>
                    <span className="tabular-nums">
                      {v.id === schichtVariableId
                        ? `${formatNumber(fromSI(schichtSumme ?? 0, v.dimension, einheiten[v.id] ?? v.defaultUnit), signifikanteStellen)} ${einheiten[v.id]}`
                        : komponentenVariableIds.has(v.id)
                          ? `${formatNumber(fromSI(komponentenSummen?.[v.id] ?? 0, v.dimension, einheiten[v.id] ?? v.defaultUnit), signifikanteStellen)} ${einheiten[v.id]}`
                          : `${werte[v.id]} ${einheiten[v.id]}`}
                    </span>
                  </li>
                ))}
                {ausgabeVariablen.map((v) => (
                  <li
                    key={v.id}
                    className="flex justify-between gap-2 border-t border-paper-200 pt-1 font-medium text-stone-800"
                  >
                    <span>{v.name}</span>
                    <span className="tabular-nums">
                      {formatNumber(ergebnis![v.id], signifikanteStellen)}
                    </span>
                  </li>
                ))}
                {eindeutigerKandidat && (
                  <li className="flex justify-between gap-2 border-t border-paper-200 pt-1 font-medium text-stone-800">
                    <span>{gesuchtVariable.name}</span>
                    <span className="tabular-nums">
                      {formatNumber(fromSI(eindeutigerKandidat.wert, gesuchtVariable.dimension, einheiten[gesucht] ?? gesuchtVariable.defaultUnit), signifikanteStellen)}{' '}
                      {einheiten[gesucht] ?? gesuchtVariable.defaultUnit}
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-stone-500">Noch kein vollständiges Ergebnis.</p>
            )}
            {eindeutigerKandidat && (
              <p className="mt-2 text-[13px] text-stone-500">
                Numerisch gelöst (Brent-Verfahren), Kontrolle: Vorwärtsrechnung mit {gesuchtVariable.name} ={' '}
                {formatNumber(fromSI(eindeutigerKandidat.wert, gesuchtVariable.dimension, einheiten[gesucht] ?? gesuchtVariable.defaultUnit), signifikanteStellen)}{' '}
                {einheiten[gesucht] ?? gesuchtVariable.defaultUnit} ergibt{' '}
                {Object.entries(eindeutigerKandidat.kontrolle)
                  .map(([id, wertSI]) => {
                    const v = variableById(formel, id)
                    return `${v.name} = ${formatNumber(fromSI(wertSI, v.dimension, einheiten[id] ?? v.defaultUnit), signifikanteStellen)} ${einheiten[id] ?? v.defaultUnit}`
                  })
                  .join(', ')}
                .
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-1 font-semibold text-stone-800">Gültigkeitsbereich</h2>
            <p className="text-stone-600">{formel.gueltigkeit}</p>
          </section>

          {formel.annahmen.length > 0 && (
            <section>
              <h2 className="mb-1 font-semibold text-stone-800">Annahmen</h2>
              <ul className="list-inside list-disc text-stone-600">
                {formel.annahmen.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-1 font-semibold text-stone-800">Quelle</h2>
            <p className="flex flex-wrap items-center gap-2 text-stone-600">
              {formel.quelle.werk}
              {formel.quelle.auflage ? `, ${formel.quelle.auflage}` : ''}
              {formel.quelle.kapitel ? `, ${formel.quelle.kapitel}` : ''}
              {formel.quelle.unsicher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  <Info size={12} />
                  Kapitelangabe unsicher
                </span>
              )}
            </p>
          </section>
        </div>
      )}

      <ZuProjektHinzufuegenSheet
        offen={projektSheetOffen}
        onClose={() => setProjektSheetOffen(false)}
        berechnung={projektBerechnung}
      />
    </div>
  )
}
