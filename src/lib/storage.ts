/**
 * Alle localStorage-Zugriffe sind in try/catch gekapselt: die App muss auch
 * ohne verfügbaren Storage (z. B. privater Modus, Quota überschritten) voll
 * funktionieren - dann eben ohne Persistenz.
 */
import type Anthropic from '@anthropic-ai/sdk'

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
