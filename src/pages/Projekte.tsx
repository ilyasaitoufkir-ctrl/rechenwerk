import { useState } from 'react'
import { Plus, FolderKanban } from 'lucide-react'
import { GroupedList, GroupedRow } from '../components/GroupedList'
import { BottomSheet } from '../components/BottomSheet'
import { EmptyState } from '../components/EmptyState'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { navigiere } from '../lib/router'
import { getProjekte, projektAnlegen } from '../lib/storage'

export function Projekte() {
  useSetHeaderTitle('Projekte')
  const [projekte, setProjekte] = useState(getProjekte)
  const [sheetOffen, setSheetOffen] = useState(false)
  const [name, setName] = useState('')
  const [beschreibung, setBeschreibung] = useState('')

  function anlegen() {
    if (!name.trim()) return
    const projekt = projektAnlegen(name.trim(), beschreibung.trim())
    setProjekte(getProjekte())
    setSheetOffen(false)
    setName('')
    setBeschreibung('')
    navigiere({ name: 'projekt', id: projekt.id })
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setSheetOffen(true)}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink"
      >
        <Plus size={16} />
        Neues Projekt
      </button>

      {projekte.length === 0 ? (
        <EmptyState icon={FolderKanban} text="Noch keine Projekte angelegt." />
      ) : (
        <GroupedList>
          {projekte.map((p) => (
            <GroupedRow
              key={p.id}
              label={p.name}
              value={`${p.berechnungen.length} Berechnungen`}
              onClick={() => navigiere({ name: 'projekt', id: p.id })}
            />
          ))}
        </GroupedList>
      )}

      <BottomSheet offen={sheetOffen} onClose={() => setSheetOffen(false)} titel="Neues Projekt">
        <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-stone-500">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Kühlwasserkreislauf Halle 3"
              className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-stone-500">Beschreibung</span>
            <textarea
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              rows={3}
              className="rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-[16px]"
            />
          </label>
          <button
            onClick={anlegen}
            disabled={!name.trim()}
            className="rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink disabled:opacity-50"
          >
            Anlegen
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
