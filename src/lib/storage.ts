/**
 * Alle localStorage-Zugriffe sind in try/catch gekapselt: die App muss auch
 * ohne verfügbaren Storage (z. B. privater Modus, Quota überschritten) voll
 * funktionieren - dann eben ohne Persistenz.
 */
import type Anthropic from '@anthropic-ai/sdk'
import type { Quelle } from '../types/formula'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage nicht verfügbar oder voll - Wert bleibt nur für die Sitzung im Speicher
  }
}

const KEYS = {
  favoriten: 'rechenwerk:favoriten',
  verlauf: 'rechenwerk:verlauf',
  verifizierungen: 'rechenwerk:verifizierungen',
  signifikanteStellen: 'rechenwerk:signifikante-stellen',
  letzteEingaben: 'rechenwerk:letzte-eingaben',
  ambientDruck: 'rechenwerk:ambient-druck',
  kiZugangscode: 'rechenwerk:ki-zugangscode',
  kiKonversationen: 'rechenwerk:ki-konversationen',
  kiNutzung: 'rechenwerk:ki-nutzung',
  projekte: 'rechenwerk:projekte',
  eigeneStoffe: 'rechenwerk:eigene-stoffe',
  letztesBackup: 'rechenwerk:letztes-backup',
  statistikUebernahme: 'rechenwerk:statistik-uebernahme',
} as const

export function getFavoriten(): string[] {
  return read<string[]>(KEYS.favoriten, [])
}

export function setFavoriten(ids: string[]): void {
  write(KEYS.favoriten, ids)
}

export function istFavorit(id: string): boolean {
  return getFavoriten().includes(id)
}

export function favoritToggeln(id: string): string[] {
  const aktuelle = getFavoriten()
  const neue = aktuelle.includes(id) ? aktuelle.filter((f) => f !== id) : [...aktuelle, id]
  setFavoriten(neue)
  return neue
}

export interface VerlaufEintrag {
  id: string
  formelId: string
  formelName: string
  zeitpunkt: number
  bekannt: Record<string, number>
  ziel: string
  ergebnis: Record<string, number>
}

const MAX_VERLAUF = 50

export function getVerlauf(): VerlaufEintrag[] {
  return read<VerlaufEintrag[]>(KEYS.verlauf, [])
}

export function verlaufEintragHinzufuegen(
  eintrag: Omit<VerlaufEintrag, 'id' | 'zeitpunkt'>,
): VerlaufEintrag[] {
  const neuerEintrag: VerlaufEintrag = {
    ...eintrag,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    zeitpunkt: Date.now(),
  }
  const neue = [neuerEintrag, ...getVerlauf()].slice(0, MAX_VERLAUF)
  write(KEYS.verlauf, neue)
  return neue
}

export function verlaufEintragLoeschen(id: string): VerlaufEintrag[] {
  const neue = getVerlauf().filter((e) => e.id !== id)
  write(KEYS.verlauf, neue)
  return neue
}

export function verlaufLeeren(): void {
  write(KEYS.verlauf, [])
}

export function setVerlauf(eintraege: VerlaufEintrag[]): void {
  write(KEYS.verlauf, eintraege.slice(0, MAX_VERLAUF))
}

export interface Verifizierung {
  formelId: string
  verifiziert: boolean
  datum: string
  notiz?: string
}

export function getVerifizierungen(): Record<string, Verifizierung> {
  return read<Record<string, Verifizierung>>(KEYS.verifizierungen, {})
}

export function getVerifizierung(formelId: string): Verifizierung | undefined {
  return getVerifizierungen()[formelId]
}

export function verifizierungSetzen(
  formelId: string,
  verifiziert: boolean,
  notiz?: string,
): Verifizierung {
  const alle = getVerifizierungen()
  const eintrag: Verifizierung = {
    formelId,
    verifiziert,
    datum: new Date().toISOString(),
    notiz,
  }
  alle[formelId] = eintrag
  write(KEYS.verifizierungen, alle)
  return eintrag
}

export function setVerifizierungen(verifizierungen: Record<string, Verifizierung>): void {
  write(KEYS.verifizierungen, verifizierungen)
}

export function getSignifikanteStellen(): number {
  return read<number>(KEYS.signifikanteStellen, 4)
}

export function setSignifikanteStellen(stellen: number): void {
  write(KEYS.signifikanteStellen, stellen)
}

export function getLetzteEingaben(formelId: string): Record<string, unknown> | undefined {
  const alle = read<Record<string, Record<string, unknown>>>(KEYS.letzteEingaben, {})
  return alle[formelId]
}

export function setLetzteEingaben(formelId: string, eingaben: Record<string, unknown>): void {
  const alle = read<Record<string, Record<string, unknown>>>(KEYS.letzteEingaben, {})
  alle[formelId] = eingaben
  write(KEYS.letzteEingaben, alle)
}

export function getAmbientDruckPa(): number {
  return read<number>(KEYS.ambientDruck, 101325)
}

export function setAmbientDruckPa(pa: number): void {
  write(KEYS.ambientDruck, pa)
}

/** Persönlicher Zugangscode für den KI-Assistenten - NICHT der API-Schlüssel, der bleibt serverseitig in Vercel. */
export function getKiZugangscode(): string {
  return read<string>(KEYS.kiZugangscode, '')
}

export function setKiZugangscode(code: string): void {
  write(KEYS.kiZugangscode, code.trim())
}

export interface KiKonversation {
  id: string
  titel: string
  erstelltAm: number
  aktualisiertAm: number
  /** Anthropic.MessageParam[] - wird unverändert als "messages" an /api/assistent gesendet. */
  nachrichten: Anthropic.MessageParam[]
}

const MAX_KI_KONVERSATIONEN = 20

export function getKiKonversationen(): KiKonversation[] {
  return read<KiKonversation[]>(KEYS.kiKonversationen, [])
}

export function getKiKonversation(id: string): KiKonversation | undefined {
  return getKiKonversationen().find((k) => k.id === id)
}

export function kiKonversationSpeichern(konversation: KiKonversation): KiKonversation[] {
  const andere = getKiKonversationen().filter((k) => k.id !== konversation.id)
  const neue = [{ ...konversation, aktualisiertAm: Date.now() }, ...andere]
    .sort((a, b) => b.aktualisiertAm - a.aktualisiertAm)
    .slice(0, MAX_KI_KONVERSATIONEN)
  write(KEYS.kiKonversationen, neue)
  return neue
}

export function kiKonversationLoeschen(id: string): KiKonversation[] {
  const neue = getKiKonversationen().filter((k) => k.id !== id)
  write(KEYS.kiKonversationen, neue)
  return neue
}

export function setKiKonversationen(konversationen: KiKonversation[]): void {
  write(KEYS.kiKonversationen, konversationen.slice(0, MAX_KI_KONVERSATIONEN))
}

export interface KiNutzung {
  anfragen: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

const KI_NUTZUNG_LEER: KiNutzung = {
  anfragen: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
}

export function getKiNutzung(): KiNutzung {
  return read<KiNutzung>(KEYS.kiNutzung, KI_NUTZUNG_LEER)
}

export function kiNutzungHinzufuegen(delta: Omit<KiNutzung, 'anfragen'>): KiNutzung {
  const aktuelle = getKiNutzung()
  const neue: KiNutzung = {
    anfragen: aktuelle.anfragen + 1,
    inputTokens: aktuelle.inputTokens + delta.inputTokens,
    outputTokens: aktuelle.outputTokens + delta.outputTokens,
    cacheReadTokens: aktuelle.cacheReadTokens + delta.cacheReadTokens,
    cacheWriteTokens: aktuelle.cacheWriteTokens + delta.cacheWriteTokens,
  }
  write(KEYS.kiNutzung, neue)
  return neue
}

export function kiNutzungZuruecksetzen(): void {
  write(KEYS.kiNutzung, KI_NUTZUNG_LEER)
}

/* ---------------------------- Projekte ---------------------------- */

export interface ProjektBerechnung {
  id: string
  formelId: string
  formelName: string
  kategorie: string
  /** Bekannte Werte in SI */
  bekannt: Record<string, number>
  ziel: string
  /** Ergebnis(e) in SI */
  ergebnis: Record<string, number>
  quelle: Quelle
  verifiziert: boolean
  richtwert: boolean
  zeitpunkt: number
}

export interface ProjektNotiz {
  id: string
  text: string
  zeitpunkt: number
}

export interface Projekt {
  id: string
  name: string
  beschreibung: string
  notizen: ProjektNotiz[]
  berechnungen: ProjektBerechnung[]
  /** Referenzen auf Fotos in IndexedDB (siehe lib/idb.ts) */
  fotoIds: string[]
  erstelltAm: number
  aktualisiertAm: number
}

export function getProjekte(): Projekt[] {
  return read<Projekt[]>(KEYS.projekte, [])
}

export function getProjekt(id: string): Projekt | undefined {
  return getProjekte().find((p) => p.id === id)
}

function neueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function projektAnlegen(name: string, beschreibung: string): Projekt {
  const neu: Projekt = {
    id: neueId(),
    name,
    beschreibung,
    notizen: [],
    berechnungen: [],
    fotoIds: [],
    erstelltAm: Date.now(),
    aktualisiertAm: Date.now(),
  }
  write(KEYS.projekte, [neu, ...getProjekte()])
  return neu
}

function projektAktualisieren(id: string, patch: (p: Projekt) => Projekt): Projekt[] {
  const neue = getProjekte().map((p) => (p.id === id ? { ...patch(p), aktualisiertAm: Date.now() } : p))
  write(KEYS.projekte, neue)
  return neue
}

export function setProjekte(projekte: Projekt[]): void {
  write(KEYS.projekte, projekte)
}

export function projektLoeschen(id: string): Projekt[] {
  const neue = getProjekte().filter((p) => p.id !== id)
  write(KEYS.projekte, neue)
  return neue
}

export function projektBearbeiten(id: string, patch: { name?: string; beschreibung?: string }): Projekt[] {
  return projektAktualisieren(id, (p) => ({ ...p, ...patch }))
}

export function projektBerechnungHinzufuegen(
  projektId: string,
  berechnung: Omit<ProjektBerechnung, 'id'>,
): Projekt[] {
  return projektAktualisieren(projektId, (p) => ({
    ...p,
    berechnungen: [{ ...berechnung, id: neueId() }, ...p.berechnungen],
  }))
}

export function projektBerechnungEntfernen(projektId: string, berechnungId: string): Projekt[] {
  return projektAktualisieren(projektId, (p) => ({
    ...p,
    berechnungen: p.berechnungen.filter((b) => b.id !== berechnungId),
  }))
}

export function projektNotizHinzufuegen(projektId: string, text: string): Projekt[] {
  return projektAktualisieren(projektId, (p) => ({
    ...p,
    notizen: [{ id: neueId(), text, zeitpunkt: Date.now() }, ...p.notizen],
  }))
}

export function projektNotizEntfernen(projektId: string, notizId: string): Projekt[] {
  return projektAktualisieren(projektId, (p) => ({
    ...p,
    notizen: p.notizen.filter((n) => n.id !== notizId),
  }))
}

export function projektFotoHinzufuegen(projektId: string, fotoId: string): Projekt[] {
  return projektAktualisieren(projektId, (p) => ({ ...p, fotoIds: [...p.fotoIds, fotoId] }))
}

export function projektFotoEntfernen(projektId: string, fotoId: string): Projekt[] {
  return projektAktualisieren(projektId, (p) => ({ ...p, fotoIds: p.fotoIds.filter((id) => id !== fotoId) }))
}

/* ------------------------- Eigene Stoffdaten ------------------------- */

export interface StoffStuetzstelle {
  temperaturK: number
  dichteKgM3?: number
  viskositaetPas?: number
  cpJkgK?: number
  lambdaWmK?: number
}

export interface EigenerStoff {
  id: string
  name: string
  quelle: string
  eigenerMesswert: boolean
  dichteKgM3?: number
  viskositaetPas?: number
  cpJkgK?: number
  lambdaWmK?: number
  /** Wenn vorhanden, werden Werte temperaturabhängig linear interpoliert statt der festen Felder oben. */
  stuetzstellen?: StoffStuetzstelle[]
  erstelltAm: number
  aktualisiertAm: number
}

export function getEigeneStoffe(): EigenerStoff[] {
  return read<EigenerStoff[]>(KEYS.eigeneStoffe, [])
}

export function getEigenerStoff(id: string): EigenerStoff | undefined {
  return getEigeneStoffe().find((s) => s.id === id)
}

export function eigenerStoffSpeichern(stoff: Omit<EigenerStoff, 'id' | 'erstelltAm' | 'aktualisiertAm'> & { id?: string }): EigenerStoff[] {
  const alle = getEigeneStoffe()
  const jetzt = Date.now()
  if (stoff.id) {
    const neue = alle.map((s) => (s.id === stoff.id ? { ...s, ...stoff, id: s.id, aktualisiertAm: jetzt } : s))
    write(KEYS.eigeneStoffe, neue)
    return neue
  }
  const neu: EigenerStoff = { ...stoff, id: neueId(), erstelltAm: jetzt, aktualisiertAm: jetzt }
  const neue = [neu, ...alle]
  write(KEYS.eigeneStoffe, neue)
  return neue
}

export function eigenerStoffLoeschen(id: string): EigenerStoff[] {
  const neue = getEigeneStoffe().filter((s) => s.id !== id)
  write(KEYS.eigeneStoffe, neue)
  return neue
}

export function setEigeneStoffe(stoffe: EigenerStoff[]): void {
  write(KEYS.eigeneStoffe, stoffe)
}

/* ----------------------------- Backup ----------------------------- */

export function getLetztesBackup(): number | null {
  return read<number | null>(KEYS.letztesBackup, null)
}

export function setLetztesBackup(zeitpunkt: number): void {
  write(KEYS.letztesBackup, zeitpunkt)
}

/* ------------- Scan -> Statistik Übernahme (einmalig abgeholt) ------------- */

/** Vom Scan-Modus "Messprotokoll" hinterlegte Werte, die Statistik beim nächsten Öffnen übernimmt und dann löscht. */
export function statistikUebernahmeAblegen(werte: number[]): void {
  write(KEYS.statistikUebernahme, werte)
}

export function statistikUebernahmeAbholen(): number[] | null {
  const werte = read<number[] | null>(KEYS.statistikUebernahme, null)
  if (werte !== null) write(KEYS.statistikUebernahme, null)
  return werte
}
