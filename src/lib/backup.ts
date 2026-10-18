/**
 * Export/Import aller App-Daten als eine JSON-Datei. Der KI-Zugangscode wird
 * bewusst NIE exportiert (siehe Projekt-Anforderung). Fotos liegen in
 * IndexedDB (lib/idb.ts) und werden als Base64-Data-URLs mit eingebettet,
 * damit ein Backup wirklich eine einzelne, vollständige Datei ist.
 */
import * as storage from './storage'
import { alleFotos, alleFotosLoeschen, fotosSpeichern, type FotoEintrag } from './idb'

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupDaten {
  schemaVersion: number
  erstelltAm: number
  favoriten: string[]
  verlauf: storage.VerlaufEintrag[]
  verifizierungen: Record<string, storage.Verifizierung>
  signifikanteStellen: number
  ambientDruckPa: number
  projekte: storage.Projekt[]
  eigeneStoffe: storage.EigenerStoff[]
  kiKonversationen: storage.KiKonversation[]
  fotos: FotoEintrag[]
}

export async function datenExportieren(): Promise<BackupDaten> {
  let fotos: FotoEintrag[] = []
  try {
    fotos = await alleFotos()
  } catch {
    // IndexedDB nicht verfügbar - Backup funktioniert trotzdem, nur ohne Fotos
  }
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    erstelltAm: Date.now(),
    favoriten: storage.getFavoriten(),
    verlauf: storage.getVerlauf(),
    verifizierungen: storage.getVerifizierungen(),
    signifikanteStellen: storage.getSignifikanteStellen(),
    ambientDruckPa: storage.getAmbientDruckPa(),
    projekte: storage.getProjekte(),
    eigeneStoffe: storage.getEigeneStoffe(),
    kiKonversationen: storage.getKiKonversationen(),
    fotos,
  }
}

export function datenAlsBlob(daten: BackupDaten): Blob {
  return new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' })
}

export function backupDateiname(): string {
  return `rechenwerk-backup-${new Date().toISOString().slice(0, 10)}.json`
}

/**
 * Prüft und migriert rohe, aus einer Datei gelesene Daten auf das aktuelle
 * Schema. Ältere Dateien (ohne schemaVersion, oder ohne die in dieser Version
 * neu hinzugekommenen Felder projekte/eigeneStoffe/fotos) werden mit leeren
 * Defaults aufgefüllt statt abgelehnt. Neuere, unbekannte Schemaversionen
 * werden mit einer klaren Fehlermeldung abgelehnt, ohne etwas zu verändern.
 */
export function migriere(roh: unknown): BackupDaten {
  if (typeof roh !== 'object' || roh === null) {
    throw new Error('Ungültige Backup-Datei: kein gültiges JSON-Objekt.')
  }
  const r = roh as Record<string, unknown>
  const version = typeof r.schemaVersion === 'number' ? r.schemaVersion : 0
  if (version > BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Diese Backup-Datei stammt aus einer neueren Version von Rechenwerk (Schema ${version}) und kann hier nicht importiert werden.`,
    )
  }
  if (r.verlauf !== undefined && !Array.isArray(r.verlauf)) {
    throw new Error('Ungültige Backup-Datei: "verlauf" hat ein unerwartetes Format.')
  }
  if (r.favoriten !== undefined && !Array.isArray(r.favoriten)) {
    throw new Error('Ungültige Backup-Datei: "favoriten" hat ein unerwartetes Format.')
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    erstelltAm: typeof r.erstelltAm === 'number' ? r.erstelltAm : Date.now(),
    favoriten: Array.isArray(r.favoriten) ? (r.favoriten as string[]) : [],
    verlauf: Array.isArray(r.verlauf) ? (r.verlauf as storage.VerlaufEintrag[]) : [],
    verifizierungen:
      typeof r.verifizierungen === 'object' && r.verifizierungen !== null
        ? (r.verifizierungen as Record<string, storage.Verifizierung>)
        : {},
    signifikanteStellen: typeof r.signifikanteStellen === 'number' ? r.signifikanteStellen : 4,
    ambientDruckPa: typeof r.ambientDruckPa === 'number' ? r.ambientDruckPa : 101325,
    projekte: Array.isArray(r.projekte) ? (r.projekte as storage.Projekt[]) : [],
    eigeneStoffe: Array.isArray(r.eigeneStoffe) ? (r.eigeneStoffe as storage.EigenerStoff[]) : [],
    kiKonversationen: Array.isArray(r.kiKonversationen) ? (r.kiKonversationen as storage.KiKonversation[]) : [],
    fotos: Array.isArray(r.fotos) ? (r.fotos as FotoEintrag[]) : [],
  }
}

/** Liest und validiert eine Backup-Datei - wirft bei defekten/unlesbaren Dateien, ohne irgendetwas zu verändern. */
export function datenLesenUndValidieren(jsonText: string): BackupDaten {
  let roh: unknown
  try {
    roh = JSON.parse(jsonText)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON und konnte nicht gelesen werden.')
  }
  return migriere(roh)
}

export interface ImportVorschau {
  erstelltAm: number
  favoritenAnzahl: number
  verlaufAnzahl: number
  projekteAnzahl: number
  eigeneStoffeAnzahl: number
  kiKonversationenAnzahl: number
  fotosAnzahl: number
}

export function erstelleVorschau(daten: BackupDaten): ImportVorschau {
  return {
    erstelltAm: daten.erstelltAm,
    favoritenAnzahl: daten.favoriten.length,
    verlaufAnzahl: daten.verlauf.length,
    projekteAnzahl: daten.projekte.length,
    eigeneStoffeAnzahl: daten.eigeneStoffe.length,
    kiKonversationenAnzahl: daten.kiKonversationen.length,
    fotosAnzahl: daten.fotos.length,
  }
}

export function mergeNachId<T extends { id: string; aktualisiertAm: number }>(lokal: T[], importiert: T[]): T[] {
  const nachId = new Map<string, T>()
  for (const eintrag of lokal) nachId.set(eintrag.id, eintrag)
  for (const eintrag of importiert) {
    const vorhanden = nachId.get(eintrag.id)
    if (!vorhanden || eintrag.aktualisiertAm >= vorhanden.aktualisiertAm) {
      nachId.set(eintrag.id, eintrag)
    }
  }
  return [...nachId.values()]
}

export function mergeFavoriten(lokal: string[], importiert: string[]): string[] {
  return [...new Set([...lokal, ...importiert])]
}

export function mergeVerlauf(
  lokal: storage.VerlaufEintrag[],
  importiert: storage.VerlaufEintrag[],
): storage.VerlaufEintrag[] {
  const nachId = new Map(lokal.map((e) => [e.id, e]))
  for (const e of importiert) if (!nachId.has(e.id)) nachId.set(e.id, e)
  return [...nachId.values()].sort((a, b) => b.zeitpunkt - a.zeitpunkt)
}

export function mergeVerifizierungen(
  lokal: Record<string, storage.Verifizierung>,
  importiert: Record<string, storage.Verifizierung>,
): Record<string, storage.Verifizierung> {
  const neu = { ...lokal }
  for (const [formelId, v] of Object.entries(importiert)) {
    const vorhanden = neu[formelId]
    if (!vorhanden || new Date(v.datum).getTime() >= new Date(vorhanden.datum).getTime()) {
      neu[formelId] = v
    }
  }
  return neu
}

export type ImportModus = 'ersetzen' | 'zusammenfuehren'

/** Wendet validierte Backup-Daten an - entweder als vollständiger Ersatz oder zusammengeführt mit den lokalen Daten. */
export async function datenImportieren(daten: BackupDaten, modus: ImportModus): Promise<void> {
  if (modus === 'ersetzen') {
    storage.setFavoriten(daten.favoriten)
    storage.setVerlauf(daten.verlauf)
    storage.setVerifizierungen(daten.verifizierungen)
    storage.setSignifikanteStellen(daten.signifikanteStellen)
    storage.setAmbientDruckPa(daten.ambientDruckPa)
    storage.setProjekte(daten.projekte)
    storage.setEigeneStoffe(daten.eigeneStoffe)
    storage.setKiKonversationen(daten.kiKonversationen)
    try {
      await alleFotosLoeschen()
      await fotosSpeichern(daten.fotos)
    } catch {
      // IndexedDB nicht verfügbar - der Rest des Imports bleibt gültig
    }
    return
  }

  // Zusammenführen: Listen vereinigen, bei gleicher ID die neuere Fassung behalten.
  storage.setFavoriten(mergeFavoriten(storage.getFavoriten(), daten.favoriten))
  storage.setVerlauf(mergeVerlauf(storage.getVerlauf(), daten.verlauf))
  storage.setVerifizierungen(mergeVerifizierungen(storage.getVerifizierungen(), daten.verifizierungen))
  storage.setProjekte(mergeNachId(storage.getProjekte(), daten.projekte))
  storage.setEigeneStoffe(mergeNachId(storage.getEigeneStoffe(), daten.eigeneStoffe))
  storage.setKiKonversationen(mergeNachId(storage.getKiKonversationen(), daten.kiKonversationen))

  try {
    await fotosSpeichern(daten.fotos)
  } catch {
    // IndexedDB nicht verfügbar - der Rest des Imports bleibt gültig
  }
}
