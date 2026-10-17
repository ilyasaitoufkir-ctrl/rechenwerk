import type { ReactNode } from 'react'

interface Props {
  offen: boolean
  onClose: () => void
  titel?: string
  children: ReactNode
}

/** Natives Bottom-Sheet für Einheitenwahl, Filter und Optionen statt Dropdowns/Popups. */
export function BottomSheet({ offen, onClose, titel, children }: Props) {
  if (!offen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Schließen"
        onClick={onClose}
        className="sheet-backdrop absolute inset-0 bg-black/30"
      />
      <div
        className="sheet-panel relative max-h-[75vh] overflow-y-auto rounded-t-[20px] bg-white pb-[calc(16px+var(--safe-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1.5 w-9 rounded-full bg-stone-300" />
        </div>
        {titel && (
          <p className="px-4 pb-2 text-center text-[13px] font-semibold uppercase tracking-wide text-stone-500">
            {titel}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
