import { Ruler, Scale, Gauge, Beaker, BarChart3, TrendingUp, Sigma, FlaskConical } from 'lucide-react'
import { alleFormeln, getKategorien } from '../formulas/registry'
import { GroupedList, GroupedRow, GroupLabel } from '../components/GroupedList'
import { navigiere, type Route } from '../lib/router'
import { useSetHeaderTitle } from '../lib/headerTitleContext'

const WERKZEUGE: { route: Route; icon: typeof Ruler; label: string }[] = [
  { route: { name: 'einheiten' }, icon: Ruler, label: 'Einheitenumrechner' },
  { route: { name: 'kauf-miete' }, icon: Scale, label: 'Kauf-/Miete-Vergleich' },
  { route: { name: 'pumpen-betriebspunkt' }, icon: Gauge, label: 'Pumpen-Betriebspunkt' },
  { route: { name: 'rezeptur-skalieren' }, icon: Beaker, label: 'Rezeptur skalieren' },
  { route: { name: 'statistik' }, icon: BarChart3, label: 'Statistik' },
  { route: { name: 'regression' }, icon: TrendingUp, label: 'Lineare Regression' },
  { route: { name: 'fehlerfortpflanzung' }, icon: Sigma, label: 'Fehlerfortpflanzung' },
  { route: { name: 'mccabe-thiele' }, icon: FlaskConical, label: 'McCabe-Thiele-Diagramm' },
]

export function Rechner() {
  useSetHeaderTitle('Rechner')
  const kategorien = getKategorien()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1.5">
        <GroupLabel>Werkzeuge</GroupLabel>
        <GroupedList>
          {WERKZEUGE.map(({ route, icon: Icon, label }) => (
            <GroupedRow key={label} label={label} icon={<Icon size={18} />} onClick={() => navigiere(route)} />
          ))}
        </GroupedList>
      </section>

      {kategorien.map((k) => {
        const formeln = alleFormeln.filter((f) => f.kategorie === k)
        return (
          <section key={k} className="flex flex-col gap-1.5">
            <GroupLabel>{k}</GroupLabel>
            <GroupedList>
              {formeln.map((f) => (
                <GroupedRow key={f.id} label={f.name} onClick={() => navigiere({ name: 'formel', id: f.id })} />
              ))}
            </GroupedList>
          </section>
        )
      })}
    </div>
  )
}
