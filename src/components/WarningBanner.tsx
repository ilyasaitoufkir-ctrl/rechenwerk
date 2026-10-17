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
      className={`flex flex-col gap-2 rounded-xl p-3 text-[13px] ${
        istWarnung ? 'bg-amber-50 text-amber-900' : 'bg-accent-50 text-accent-900'
      }`}
    >
      {nachrichten.map((n, i) => (
        <div key={i} className="flex items-start gap-2">
          {istWarnung ? (
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          ) : (
            <Info size={15} className="mt-0.5 shrink-0" />
          )}
          <span>{n}</span>
        </div>
      ))}
    </div>
  )
}
