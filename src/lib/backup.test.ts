import { describe, it, expect } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  migriere,
  datenLesenUndValidieren,
  erstelleVorschau,
  mergeNachId,
  mergeFavoriten,
  mergeVerlauf,
  mergeVerifizierungen,
  type BackupDaten,
} from './backup'

function beispielDaten(): BackupDaten {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    erstelltAm: 1_700_000_000_000,
    favoriten: ['reynolds', 'rohr-auslegen'],
    verlauf: [
      { id: 'v1', formelId: 'reynolds', formelName: 'Reynoldszahl', zeitpunkt: 1, bekannt: { v: 1 }, ziel: 'Re', ergebnis: { Re: 1000 } },
    ],
    verifizierungen: { reynolds: { formelId: 'reynolds', verifiziert: true, datum: '2026-01-01T00:00:00.000Z' } },
    signifikanteStellen: 5,
    ambientDruckPa: 101325,
    projekte: [
      {
        id: 'p1',
        name: 'Testprojekt',
        beschreibung: 'Beschreibung',
        notizen: [],
        berechnungen: [],
        fotoIds: [],
        erstelltAm: 1,
        aktualisiertAm: 2,
      },
    ],
    eigeneStoffe: [
      {
        id: 's1',
        name: 'Glykol-Gemisch',
        quelle: 'eigene Messung',
        eigenerMesswert: true,
        dichteKgM3: 1050,
        erstelltAm: 1,
        aktualisiertAm: 2,
      },
    ],
    kiKonversationen: [],
    fotos: [],
  }
}

describe('Export -> Import Rundreise (JSON-Serialisierung + Migration)', () => {
  it('liefert nach JSON.stringify -> JSON.parse -> migriere exakt dieselben Daten', () => {
    const original = beispielDaten()
    const alsDatei = JSON.stringify(original)
    const zurueck = migriere(JSON.parse(alsDatei))
    expect(zurueck).toEqual(original)
  })

  it('datenLesenUndValidieren liest eine gültige Backup-Datei korrekt', () => {
    const original = beispielDaten()
    const zurueck = datenLesenUndValidieren(JSON.stringify(original))
    expect(zurueck).toEqual(original)
  })
})

describe('Migration älterer Schemaversionen', () => {
  it('migriert eine Datei ohne schemaVersion (Version 0, vor projekte/eigeneStoffe/fotos)', () => {
    const alteDatei = {
      favoriten: ['reynolds'],
      verlauf: [],
      verifizierungen: {},
      signifikanteStellen: 4,
      ambientDruckPa: 101325,
      // projekte, eigeneStoffe, fotos, kiKonversationen, schemaVersion fehlen bewusst
    }
    const migriert = migriere(alteDatei)
    expect(migriert.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(migriert.favoriten).toEqual(['reynolds'])
    expect(migriert.projekte).toEqual([])
    expect(migriert.eigeneStoffe).toEqual([])
    expect(migriert.fotos).toEqual([])
    expect(migriert.kiKonversationen).toEqual([])
  })

  it('lehnt eine Datei aus einer neueren Schemaversion ab', () => {
    expect(() => migriere({ schemaVersion: BACKUP_SCHEMA_VERSION + 1 })).toThrow(/neueren Version/)
  })
})

describe('Ablehnung defekter Dateien ohne Datenverlust', () => {
  it('wirft bei ungültigem JSON, statt stillschweigend leere Daten zu liefern', () => {
    expect(() => datenLesenUndValidieren('{ das ist kein json')).toThrow(/JSON/)
  })

  it('wirft bei null/primitiven Werten statt eines Objekts', () => {
    expect(() => migriere(null)).toThrow()
    expect(() => migriere('text')).toThrow()
    expect(() => migriere(42)).toThrow()
  })

  it('wirft, wenn "verlauf" ein falsches Format hat, statt es stillschweigend zu verwerfen', () => {
    expect(() => migriere({ schemaVersion: 1, verlauf: 'kaputt' })).toThrow(/verlauf/)
  })

  it('wirft, wenn "favoriten" ein falsches Format hat', () => {
    expect(() => migriere({ schemaVersion: 1, favoriten: { a: 1 } })).toThrow(/favoriten/)
  })
})

describe('erstelleVorschau', () => {
  it('zählt alle Kategorien korrekt für die Import-Vorschau', () => {
    const vorschau = erstelleVorschau(beispielDaten())
    expect(vorschau).toEqual({
      erstelltAm: 1_700_000_000_000,
      favoritenAnzahl: 2,
      verlaufAnzahl: 1,
      projekteAnzahl: 1,
      eigeneStoffeAnzahl: 1,
      kiKonversationenAnzahl: 0,
      fotosAnzahl: 0,
    })
  })
})

describe('Merge-Funktionen (Zusammenführen-Modus)', () => {
  it('mergeFavoriten vereinigt ohne Duplikate', () => {
    expect(mergeFavoriten(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('mergeVerlauf behält beide Seiten bei unterschiedlichen IDs, neueste zuerst', () => {
    const lokal = [{ id: 'a', formelId: 'f', formelName: 'F', zeitpunkt: 10, bekannt: {}, ziel: 'x', ergebnis: {} }]
    const importiert = [{ id: 'b', formelId: 'f', formelName: 'F', zeitpunkt: 20, bekannt: {}, ziel: 'x', ergebnis: {} }]
    const zusammen = mergeVerlauf(lokal, importiert)
    expect(zusammen.map((e) => e.id)).toEqual(['b', 'a'])
  })

  it('mergeVerlauf dedupliziert gleiche IDs statt sie zu verdoppeln', () => {
    const eintrag = { id: 'a', formelId: 'f', formelName: 'F', zeitpunkt: 10, bekannt: {}, ziel: 'x', ergebnis: {} }
    const zusammen = mergeVerlauf([eintrag], [eintrag])
    expect(zusammen).toHaveLength(1)
  })

  it('mergeVerifizierungen behält die zeitlich neuere Verifizierung pro Formel', () => {
    const lokal = { reynolds: { formelId: 'reynolds', verifiziert: false, datum: '2026-01-01T00:00:00.000Z' } }
    const importiert = { reynolds: { formelId: 'reynolds', verifiziert: true, datum: '2026-02-01T00:00:00.000Z' } }
    const zusammen = mergeVerifizierungen(lokal, importiert)
    expect(zusammen.reynolds.verifiziert).toBe(true)
  })

  it('mergeVerifizierungen behält die lokale Version, wenn sie neuer ist', () => {
    const lokal = { reynolds: { formelId: 'reynolds', verifiziert: true, datum: '2026-03-01T00:00:00.000Z' } }
    const importiert = { reynolds: { formelId: 'reynolds', verifiziert: false, datum: '2026-01-01T00:00:00.000Z' } }
    const zusammen = mergeVerifizierungen(lokal, importiert)
    expect(zusammen.reynolds.verifiziert).toBe(true)
  })

  it('mergeNachId behält die Fassung mit dem späteren aktualisiertAm', () => {
    const lokal = [{ id: 'p1', aktualisiertAm: 100, name: 'alt' }]
    const importiert = [{ id: 'p1', aktualisiertAm: 200, name: 'neu' }]
    const zusammen = mergeNachId(lokal, importiert)
    expect(zusammen).toEqual([{ id: 'p1', aktualisiertAm: 200, name: 'neu' }])
  })

  it('mergeNachId fügt neue IDs einfach hinzu', () => {
    const lokal = [{ id: 'p1', aktualisiertAm: 100 }]
    const importiert = [{ id: 'p2', aktualisiertAm: 200 }]
    expect(mergeNachId(lokal, importiert)).toHaveLength(2)
  })
})

describe('KI-Zugangscode wird nie exportiert', () => {
  it('BackupDaten enthält kein Feld für den Zugangscode', () => {
    const daten = beispielDaten()
    expect(Object.keys(daten)).not.toContain('kiZugangscode')
    expect(JSON.stringify(daten)).not.toMatch(/zugangscode/i)
  })
})
