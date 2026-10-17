import { alleFormeln } from '../formulas/registry'
import { KategorieBild } from '../components/KategorieBild'
import { GroupedList, GroupedRow } from '../components/GroupedList'
import { navigiere } from '../lib/router'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { KATEGORIE_BILD } from '../lib/kategorieBilder'

export function KategorieDetail({ kategorie }: { kategorie: string }) {
  useSetHeaderTitle(kategorie)
  const formeln = alleFormeln.filter((f) => f.kategorie === kategorie)
  const slug = KATEGORIE_BILD[kategorie]

  return (
    <div className="-mx-4 -mt-2 flex flex-col gap-4">
      {slug && (
        <div className="relative h-[140px] w-full">
          <KategorieBild slug={slug} alt={kategorie} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="eyebrow">Kategorie</span>
            <p className="text-[22px] font-bold text-stone-900">{kategorie}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 px-4 pb-2">
        <GroupedList>
          {formeln.map((f) => (
            <GroupedRow key={f.id} label={f.name} onClick={() => navigiere({ name: 'formel', id: f.id })} />
          ))}
        </GroupedList>
      </div>
    </div>
  )
}
