import { lazy, Suspense } from 'react'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { useRoute } from './lib/router'
import { TransferProvider } from './lib/transfer'
import { HeaderTitleProvider } from './lib/headerTitle'

const Rechner = lazy(() => import('./pages/Rechner').then((m) => ({ default: m.Rechner })))
const Bibliothek = lazy(() => import('./pages/Bibliothek').then((m) => ({ default: m.Bibliothek })))
const Einstellungen = lazy(() => import('./pages/Einstellungen').then((m) => ({ default: m.Einstellungen })))
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })))
const UnitConverter = lazy(() => import('./pages/UnitConverter').then((m) => ({ default: m.UnitConverter })))
const KaufMieteVergleich = lazy(() =>
  import('./pages/KaufMieteVergleich').then((m) => ({ default: m.KaufMieteVergleich })),
)
const PumpenBetriebspunkt = lazy(() =>
  import('./pages/PumpenBetriebspunkt').then((m) => ({ default: m.PumpenBetriebspunkt })),
)
const RezepturSkalieren = lazy(() =>
  import('./pages/RezepturSkalieren').then((m) => ({ default: m.RezepturSkalieren })),
)
const Statistik = lazy(() => import('./pages/Statistik').then((m) => ({ default: m.Statistik })))
const Regression = lazy(() => import('./pages/Regression').then((m) => ({ default: m.Regression })))
const Fehlerfortpflanzung = lazy(() =>
  import('./pages/Fehlerfortpflanzung').then((m) => ({ default: m.Fehlerfortpflanzung })),
)
const McCabeThiele = lazy(() => import('./pages/McCabeThiele').then((m) => ({ default: m.McCabeThiele })))
const Assistent = lazy(() => import('./pages/Assistent').then((m) => ({ default: m.Assistent })))
const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage })),
)

function Ladeanzeige() {
  return <div className="h-40 animate-pulse rounded-2xl bg-paper-200" />
}

function Seite() {
  const route = useRoute()

  switch (route.name) {
    case 'home':
      return <Home />
    case 'rechner':
      return <Rechner />
    case 'bibliothek':
      return <Bibliothek />
    case 'einstellungen':
      return <Einstellungen />
    case 'verlauf':
      return <History />
    case 'einheiten':
      return <UnitConverter />
    case 'kauf-miete':
      return <KaufMieteVergleich />
    case 'pumpen-betriebspunkt':
      return <PumpenBetriebspunkt />
    case 'rezeptur-skalieren':
      return <RezepturSkalieren />
    case 'statistik':
      return <Statistik />
    case 'regression':
      return <Regression />
    case 'fehlerfortpflanzung':
      return <Fehlerfortpflanzung />
    case 'mccabe-thiele':
      return <McCabeThiele />
    case 'assistent':
      return <Assistent />
    case 'formel':
      return <CalculatorPage id={route.id} />
  }
}

export function App() {
  return (
    <TransferProvider>
      <HeaderTitleProvider>
        <Layout>
          <Suspense fallback={<Ladeanzeige />}>
            <Seite />
          </Suspense>
        </Layout>
      </HeaderTitleProvider>
    </TransferProvider>
  )
}
