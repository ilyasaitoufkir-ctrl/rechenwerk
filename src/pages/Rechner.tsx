import { Ruler, Scale, Gauge, Beaker, BarChart3, TrendingUp, Sigma, FlaskConical, ChevronRight, Boxes, Workflow } from 'lucide-react'
import { alleFormeln, getKategorien } from '../formulas/registry'
import { KategorieBild } from '../components/KategorieBild'
import { navigiere, type Route } from '../lib/router'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { KATEGORIE_BILD } from '../lib/kategorieBilder'

const WERKZEUGE: { route: Route; icon: typeof Ruler; label: string }[] = [
  { route: { name: 'einheiten' }, icon: Ruler, label: 'Einheitenumrechner' },
  { route: { name: 'kauf-miete' }, icon: Scale, label: 'Kauf-/Miete-Vergleich' },
  { route: { name: 'pumpen-betriebspunkt' }, icon: Gauge, label: 'Pumpen-Betriebspunkt' },
  { route: { name: 'rezeptur-skalieren' }, icon: Beaker, label: 'Rezeptur skalieren' },
  { route: { name: 'statistik' }, icon: BarChart3, label: 'Statistik' },
  { route: { name: 'regression' }, icon: TrendingUp, label: 'Lineare Regression' },
  { route: { name: 'fehlerfortpflanzung' }, icon: Sigma, label: 'Fehlerfortpflanzung' },
  { route: { name: 'mccabe-thiele' }, icon: FlaskConical, label: 'McCabe-Thiele-Diagramm' },
  { route: { name: 'baukasten' }, icon: Boxes, label: 'Rohrleitungs-Baukasten' },
  { route: { name: 'bilanz' }, icon: Workflow, label: 'Bilanz-Fließbild' },
]

const KATEGORIE_UNTERZEILE: Record<string, string> = {
  'Strömung & Rohrleitungen': 'Rohrauslegung, Druckverlust, Reynoldszahl',
  Wärmeübertragung: 'Wärmedurchgang, Wärmetauscher, Dämmung',
  'Dampf (IAPWS-IF97)': 'Zustandsgrößen, Sättigung, Dampfbedarf',
  Pumpen: 'Förderhöhe, NPSH, Affinitätsgesetze',
  'Dosierung & Mischen': 'Massenbilanz, Verdünnung, Mischtemperatur',
  'Behälter & Geometrie': 'Volumen, Füllstand, Blechgewicht',
  Druckgeräte: 'Wanddicke, Prüfdruck, DGRL-Einstufung',
  Sicherheitsventile: 'Kritische und unterkritische Ausströmung',
  Rektifikation: 'McCabe-Thiele, Fenske, Gilliland',
  'Energie & Kosten': 'Verbrauch, Emissionen, Wirtschaftlichkeit',
}

/** Zweiteiliges Label im Kartenstil: erstes Wort hell, Rest fett/weiß. */
function zweiteiligesLabel(kategorie: string): { erster: string; rest: string } {
  const bereinigt = kategorie.replace(/\s*\([^)]*\)/, '').trim()
  const [erster, ...restWoerter] = bereinigt.split(/\s*&\s*|\s+/)
  return { erster: erster.toUpperCase(), rest: restWoerter.join(' ').toUpperCase() }
}

export function Rechner() {
  useSetHeaderTitle('Rechner')
  const kategorien = getKategorien()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Werkzeuge</span>
        <div className="grid grid-cols-2 gap-2.5">
          {WERKZEUGE.map(({ route, icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => navigiere(route)}
              className="flex flex-col items-start gap-2.5 rounded-2xl bg-paper-200 p-3.5 text-left"
            >
              <Icon size={22} strokeWidth={1.25} className="text-accent-600" />
              <span className="text-[13px] font-medium leading-snug text-stone-800">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <span className="eyebrow px-1">Kategorien</span>
        <div className="flex flex-col gap-3">
          {kategorien.map((k) => {
            const anzahl = alleFormeln.filter((f) => f.kategorie === k).length
            const { erster, rest } = zweiteiligesLabel(k)
            return (
              <button
                key={k}
                onClick={() => navigiere({ name: 'rechner-kategorie', kategorie: k })}
                className="relative h-[150px] overflow-hidden rounded-2xl text-left"
              >
                <KategorieBild slug={KATEGORIE_BILD[k] ?? ''} alt={k} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
                  <div className="min-w-0">
                    <p className="text-[19px] font-bold leading-tight tracking-wide text-stone-900">
                      <span className="font-light text-stone-400">{erster} </span>
                      {rest}
                    </p>
                    <p className="truncate text-[12px] text-stone-500">{KATEGORIE_UNTERZEILE[k]}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 text-accent-600">
                    <span className="text-[12px] font-medium tabular-nums">{anzahl}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
