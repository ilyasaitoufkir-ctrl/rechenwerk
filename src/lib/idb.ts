/**
 * Minimaler IndexedDB-Wrapper für Fotos und andere größere Daten, die nicht
 * ins localStorage-Quota passen (Projekte, Scan-Aufnahmen). Keine externe
 * Bibliothek - rohe IndexedDB-API, promisifiziert.
 */
const DB_NAME = 'rechenwerk'
const DB_VERSION = 1
const STORE_FOTOS = 'fotos'

export interface FotoEintrag {
  id: string
  /** data:image/jpeg;base64,... - clientseitig bereits komprimiert */
  dataUrl: string
  projektId?: string
  kontext: 'projekt' | 'scan'
  erstelltAm: number
}

function istVerfuegbar(): boolean {
  return typeof indexedDB !== 'undefined'
}

function oeffneDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!istVerfuegbar()) {
      reject(new Error('IndexedDB in dieser Umgebung nicht verfügbar'))
      return
    }
    const anfrage = indexedDB.open(DB_NAME, DB_VERSION)
    anfrage.onupgradeneeded = () => {
      const db = anfrage.result
      if (!db.objectStoreNames.contains(STORE_FOTOS)) {
        const store = db.createObjectStore(STORE_FOTOS, { keyPath: 'id' })
        store.createIndex('projektId', 'projektId', { unique: false })
      }
    }
    anfrage.onsuccess = () => resolve(anfrage.result)
    anfrage.onerror = () => reject(anfrage.error ?? new Error('IndexedDB konnte nicht geöffnet werden'))
  })
}

async function mitStore<T>(modus: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await oeffneDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_FOTOS, modus)
    const store = tx.objectStore(STORE_FOTOS)
    const anfrage = fn(store)
    anfrage.onsuccess = () => resolve(anfrage.result)
    anfrage.onerror = () => reject(anfrage.error ?? new Error('IndexedDB-Operation fehlgeschlagen'))
  })
}

export async function fotoSpeichern(eintrag: FotoEintrag): Promise<void> {
  await mitStore('readwrite', (store) => store.put(eintrag))
}

export async function fotoLaden(id: string): Promise<FotoEintrag | undefined> {
  return mitStore('readonly', (store) => store.get(id))
}

export async function fotoLoeschen(id: string): Promise<void> {
  await mitStore('readwrite', (store) => store.delete(id))
}

export async function fotosFuerProjekt(projektId: string): Promise<FotoEintrag[]> {
  const alle = await alleFotos()
  return alle.filter((f) => f.projektId === projektId)
}

export async function alleFotos(): Promise<FotoEintrag[]> {
  if (!istVerfuegbar()) return []
  return mitStore('readonly', (store) => store.getAll())
}

/** Für Backup-Import im Ersetzen-Modus: löscht alle vorhandenen Fotos vor dem Einspielen. */
export async function alleFotosLoeschen(): Promise<void> {
  await mitStore('readwrite', (store) => store.clear())
}

export async function fotosSpeichern(fotos: FotoEintrag[]): Promise<void> {
  for (const foto of fotos) {
    await fotoSpeichern(foto)
  }
}
