import { AlertTriangle, Info } from 'lucide-react'

interface Props {
  nachrichten: string[]
  variante?: 'warnung' | 'info'
}

export function WarningBanner({ nachrichten, variante = 'warnung' }: Props) {
  if (nachrichten.length === 0) return null
  const istWarnung = variante === 'warnung'

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 text-sm ${
        istWarnung
          ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200'
          : 'border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-700/50 dark:bg-accent-900/20 dark:text-accent-200'
      }`}
    >
      {nachrichten.map((n, i) => (
        <div key={i} className="flex items-start gap-2">
          {istWarnung ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <Info size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{n}</span>
        </div>
      ))}
    </div>
  )
}
