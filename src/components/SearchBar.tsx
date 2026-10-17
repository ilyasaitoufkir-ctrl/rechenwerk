import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Formel oder Rechner suchen' }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-paper-200 px-3 py-2.5">
      <Search size={17} className="shrink-0 text-stone-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-[16px] text-stone-900 outline-none placeholder:text-stone-500"
      />
    </div>
  )
}
