import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { History } from './pages/History'
import { UnitConverter } from './pages/UnitConverter'
import { CalculatorPage } from './pages/CalculatorPage'
import { useRoute } from './lib/router'
import { TransferProvider } from './lib/transfer'

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
    case 'formel':
      return <CalculatorPage id={route.id} />
  }
}

export function App() {
  return (
    <TransferProvider>
      <Layout>
        <Seite />
      </Layout>
    </TransferProvider>
  )
}
