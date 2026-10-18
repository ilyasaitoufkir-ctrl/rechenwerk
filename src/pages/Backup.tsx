import { useRef, useState } from 'react'
import { Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { GroupedList, GroupedRow, GroupLabel } from '../components/GroupedList'
import { SegmentedControl } from '../components/SegmentedControl'
import { useSetHeaderTitle } from '../lib/headerTitleContext'
import { getLetztesBackup, setLetztesBackup } from '../lib/storage'
import {
  datenExportieren,
  datenAlsBlob,
  backupDateiname,
  datenLesenUndValidieren,
  erstelleVorschau,
  datenImportieren,
  type BackupDaten,
  type ImportVorschau,
  type ImportModus,
} from '../lib/backup'

export function Backup() {
  useSetHeaderTitle('Backup')
  const [exportiere, setExportiere] = useState(false)
  const [importFehler, setImportFehler] = useState<string | null>(null)
  const [vorschau, setVorschau] = useState<{ daten: BackupDaten; info: ImportVorschau } | null>(null)
  const [modus, setModus] = useState<ImportModus>('zusammenfuehren')
  const [importiere, setImportiere] = useState(false)
  const [fertig, setFertig] = useState(false)
  const dateiInputRef = useRef<HTMLInputElement>(null)
  const letztesBackup = getLetztesBackup()

  async function exportieren() {
    setExportiere(true)
    try {
      const daten = await datenExportieren()
      const blob = datenAlsBlob(daten)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backupDateiname()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setLetztesBackup(Date.now())
    } finally {
      setExportiere(false)
    }
  }

  async function dateiAusgewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return
    setImportFehler(null)
    setFertig(false)
    try {
      const text = await datei.text()
      const daten = datenLesenUndValidieren(text)
      setVorschau({ daten, info: erstelleVorschau(daten) })
    } catch (err) {
      setVorschau(null)
      setImportFehler(err instanceof Error ? err.message : 'Datei konnte nicht gelesen werden.')
    }
  }

  async function jetztImportieren() {
    if (!vorschau) return
    setImportiere(true)
    try {
      await datenImportieren(vorschau.daten, modus)
      setVorschau(null)
      setFertig(true)
    } catch (err) {
      setImportFehler(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    } finally {
      setImportiere(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1.5">
        <GroupLabel>Exportieren</GroupLabel>
        <GroupedList>
          <GroupedRow
            label={exportiere ? 'Wird erstellt...' : 'Backup exportieren'}
            icon={<Download size={18} />}
            onClick={exportiere ? undefined : () => void exportieren()}
            chevron={false}
          />
        </GroupedList>
        <p className="px-1 text-[12px] text-stone-500">
          {letztesBackup
            ? `Letztes Backup: ${new Date(letztesBackup).toLocaleDateString('de-DE')}`
            : 'Noch kein Backup erstellt.'}{' '}
          Enthält Favoriten, Verlauf, Prüfnotizen, Projekte, eigene Stoffdaten, Assistent-Verlauf und Fotos - nicht
          den Zugangscode des Assistenten.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <GroupLabel>Importieren</GroupLabel>
        <GroupedList>
          <GroupedRow
            label="Backup-Datei auswählen"
            icon={<Upload size={18} />}
            onClick={() => dateiInputRef.current?.click()}
            chevron={false}
          />
        </GroupedList>
        <input ref={dateiInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void dateiAusgewaehlt(e)} />
      </section>

      {importFehler && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-100 p-3 text-[14px] text-red-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{importFehler}</span>
        </div>
      )}

      {fertig && (
        <div className="flex items-start gap-2 rounded-2xl bg-sage-100 p-3 text-[14px] text-sage-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>Import abgeschlossen. Die App lädt neu, damit überall die neuen Daten angezeigt werden.</span>
        </div>
      )}
      {fertig && (
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink"
        >
          Jetzt neu laden
        </button>
      )}

      {vorschau && (
        <section className="flex flex-col gap-3 rounded-2xl bg-paper-200 p-4">
          <p className="text-[15px] font-medium text-stone-900">
            Backup vom {new Date(vorschau.info.erstelltAm).toLocaleString('de-DE')}
          </p>
          <ul className="flex flex-col gap-1 text-[13px] text-stone-600">
            <li>{vorschau.info.favoritenAnzahl} Favoriten</li>
            <li>{vorschau.info.verlaufAnzahl} Verlaufseinträge</li>
            <li>{vorschau.info.projekteAnzahl} Projekte</li>
            <li>{vorschau.info.eigeneStoffeAnzahl} eigene Stoffe</li>
            <li>{vorschau.info.kiKonversationenAnzahl} Assistent-Unterhaltungen</li>
            <li>{vorschau.info.fotosAnzahl} Fotos</li>
          </ul>

          <span className="eyebrow">Wie importieren?</span>
          <SegmentedControl
            value={modus}
            onChange={setModus}
            optionen={[
              { value: 'zusammenfuehren', label: 'Zusammenführen' },
              { value: 'ersetzen', label: 'Ersetzen' },
            ]}
          />
          <p className="text-[12px] text-stone-500">
            {modus === 'ersetzen'
              ? 'Ersetzt alle vorhandenen Daten in dieser App unwiderruflich durch den Inhalt der Datei.'
              : 'Führt die Datei mit den vorhandenen Daten zusammen - bei Dopplungen gewinnt jeweils die neuere Fassung.'}
          </p>

          <button
            onClick={() => void jetztImportieren()}
            disabled={importiere}
            className="rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-medium text-ink disabled:opacity-50"
          >
            {importiere ? 'Importiere...' : 'Importieren'}
          </button>
        </section>
      )}
    </div>
  )
}
