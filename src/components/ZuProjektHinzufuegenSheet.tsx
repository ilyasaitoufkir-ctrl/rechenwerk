import { useState } from 'react'
import { Plus, FolderPlus, Check } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { getProjekte, projektAnlegen, projektBerechnungHinzufuegen, type ProjektBerechnung } from '../lib/storage'

interface Props {
  offen: boolean
  onClose: () => void
  berechnung: Omit<ProjektBerechnung, 'id'> | null
}

/** Bottom Sheet zum Ablegen einer Berechnung in einem (neuen oder bestehenden) Projekt - aus dem Rechner und aus dem Verlauf aufrufbar. */
export function ZuProjektHinzufuegenSheet({ offen, onClose, berechnung }: Props) {
  const [projekte, setProjekte] = useState(getProjekte)
  const [neuerName, setNeuerName] = useState('')
  const [gespeichertIn, setGespeichertIn] = useState<string | null>(null)

  function hinzufuegen(projektId: string) {
    if (!berechnung) return
    projektBerechnungHinzufuegen(projektId, berechnung)
    setGespeichertIn(projektId)
    setTimeout(() => {
      setGespeichertIn(null)
      onClose()
    }, 700)
  }

  function neuesProjektUndHinzufuegen() {
    if (!neuerName.trim() || !berechnung) return
    const projekt = projektAnlegen(neuerName.trim(), '')
    projektBerechnungHinzufuegen(projekt.id, berechnung)
    setProjekte(getProjekte())
    setNeuerName('')
    setGespeichertIn(projekt.id)
    setTimeout(() => {
      setGespeichertIn(null)
      onClose()
    }, 700)
  }

  return (
    <BottomSheet offen={offen} onClose={onClose} titel="Zu Projekt hinzufügen">
      <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
        {projekte.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {projekte.map((p) => (
              <button
                key={p.id}
                onClick={() => hinzufuegen(p.id)}
                className="flex items-center justify-between gap-2 rounded-xl bg-paper-200 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] text-stone-900">{p.name}</span>
                {gespeichertIn === p.id && <Check size={16} className="shrink-0 text-sage-600" />}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-paper-300 pt-3">
          <FolderPlus size={18} className="shrink-0 text-stone-400" />
          <input
            value={neuerName}
            onChange={(e) => setNeuerName(e.target.value)}
            placeholder="Neues Projekt..."
            className="min-w-0 flex-1 rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
          />
          <button
            onClick={neuesProjektUndHinzufuegen}
            disabled={!neuerName.trim()}
            className="shrink-0 rounded-lg bg-accent-600 p-2 text-ink disabled:opacity-50"
            aria-label="Neues Projekt anlegen und hinzufügen"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
