import { lazy, Suspense } from 'react'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { useRoute } from './lib/router'
import { TransferProvider } from './lib/transfer'

const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })))
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })))
const UnitConverter = lazy(() => import('./pages/UnitConverter').then((m) => ({ default: m.UnitConverter })))
const Pruefliste = lazy(() => import('./pages/Pruefliste').then((m) => ({ default: m.Pruefliste })))
const KaufMieteVergleich = lazy(() =>
  import('./pages/KaufMieteVergleich').then((m) => ({ default: m.KaufMieteVergleich })),
)
const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage })),
)

function Ladeanzeige() {
  return <div className="h-40 animate-pulse rounded-xl bg-paper-200 dark:bg-white/10" />
}

function Seite() {
  const route = useRoute()

  switch (route.name) {
    case 'home':
      return <Home />
    case 'bibliothek':
      return <Library />
    case 'verlauf':
      return <History />
    case 'einheiten':
      return <UnitConverter />
    case 'pruefliste':
      return <Pruefliste />
    case 'kauf-miete':
      return <KaufMieteVergleich />
    case 'formel':
      return <CalculatorPage id={route.id} />
  }
}

export function App() {
  return (
    <TransferProvider>
      <Layout>
        <Suspense fallback={<Ladeanzeige />}>
          <Seite />
        </Suspense>
      </Layout>
    </TransferProvider>
  )
}
