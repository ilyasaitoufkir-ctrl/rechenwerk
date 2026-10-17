interface Props<T extends string> {
  value: T
  onChange: (v: T) => void
  optionen: { value: T; label: string }[]
}

export function SegmentedControl<T extends string>({ value, onChange, optionen }: Props<T>) {
  return (
    <div className="flex gap-0.5 rounded-xl bg-paper-200 p-0.5">
      {optionen.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[10px] px-2 py-1.5 text-[13px] font-medium transition-colors ${
            value === o.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 active:text-stone-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
