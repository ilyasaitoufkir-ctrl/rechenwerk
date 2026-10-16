import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Formel oder Rechner suchen…' }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-4 py-3 dark:border-white/15 dark:bg-white/5">
      <Search size={18} className="text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-stone-400"
      />
    </div>
  )
}
