/**
 * Bilanz-Fließbild: löst eine Komponentenmassenbilanz über ein Netz aus Zulauf-, Mischer-,
 * Splitter-, Trenner- und Produktblöcken als lineares Gleichungssystem (Gauß-Elimination mit
 * Pivotisierung über Komponentenmassenströmen je Strom) - damit werden auch Rückführungen ohne
 * Iteration gelöst.
 */

export interface Komponente {
  id: string
  name: string
}

export interface Strom {
  id: string
  name: string
}

export type Block =
  | { typ: 'zulauf'; id: string; name: string; ausgang: string; massenstromKgH: number; anteile: Record<string, number> }
  | { typ: 'mischer'; id: string; name: string; eingaenge: string[]; ausgang: string }
  | { typ: 'splitter'; id: string; name: string; eingang: string; ausgaenge: { strom: string; anteil: number }[] }
  | { typ: 'trenner'; id: string; name: string; eingang: string; kopfstrom: string; sumpfstrom: string; anteilKopf: Record<string, number> }
  | { typ: 'produkt'; id: string; name: string; eingang: string }

export interface BilanzModell {
  komponenten: Komponente[]
  stroeme: Strom[]
  bloecke: Block[]
}

export interface FreiheitsgradErgebnis {
  unbekannte: number
  gleichungen: number
  differenz: number
  status: 'bestimmt' | 'unterbestimmt' | 'ueberbestimmt'
  hinweis: string
}

function gleichungenJeBlock(block: Block, anzahlKomponenten: number): number {
  switch (block.typ) {
    case 'zulauf':
      return anzahlKomponenten
    case 'mischer':
      return anzahlKomponenten
    case 'splitter':
      return block.ausgaenge.length * anzahlKomponenten
    case 'trenner':
      return 2 * anzahlKomponenten
    case 'produkt':
      return 0
  }
}

/** Zählt Unbekannte (Strom × Komponente) gegen die von den Blöcken gelieferten Gleichungen - vor
 * jedem Lösungsversuch, damit unter- oder überbestimmte Netze klar gemeldet werden. */
export function freiheitsgrad(modell: BilanzModell): FreiheitsgradErgebnis {
  const unbekannte = modell.stroeme.length * modell.komponenten.length
  const gleichungen = modell.bloecke.reduce((sum, b) => sum + gleichungenJeBlock(b, modell.komponenten.length), 0)
  const differenz = gleichungen - unbekannte
  const status: FreiheitsgradErgebnis['status'] = differenz === 0 ? 'bestimmt' : differenz < 0 ? 'unterbestimmt' : 'ueberbestimmt'
  const hinweis =
    status === 'bestimmt'
      ? 'Das Fließbild ist eindeutig bestimmt.'
      : status === 'unterbestimmt'
        ? `Unterbestimmt: ${-differenz} Angabe(n) fehlen noch (z. B. ein weiterer Zulauf, Splitter-Teilungsverhältnis oder Trenner-Anteil).`
        : `Überbestimmt: ${differenz} Angabe(n) zu viel (z. B. doppelte oder widersprüchliche Vorgaben).`
  return { unbekannte, gleichungen, differenz, status, hinweis }
}

/** Gauß-Jordan-Elimination mit Spaltenpivotisierung (größtes Pivotelement). */
export function gaussLoesen(A: number[][], b: number[]): number[] {
  const n = A.length
  const M = A.map((zeile, i) => [...zeile, b[i]])

  for (let spalte = 0; spalte < n; spalte++) {
    let pivotZeile = spalte
    for (let r = spalte + 1; r < n; r++) {
      if (Math.abs(M[r][spalte]) > Math.abs(M[pivotZeile][spalte])) pivotZeile = r
    }
    if (Math.abs(M[pivotZeile][spalte]) < 1e-10) {
      throw new Error('Gleichungssystem ist singulär - keine eindeutige Lösung (Fließbild-Topologie prüfen)')
    }
    ;[M[spalte], M[pivotZeile]] = [M[pivotZeile], M[spalte]]

    const pivot = M[spalte][spalte]
    for (let c = spalte; c <= n; c++) M[spalte][c] /= pivot

    for (let r = 0; r < n; r++) {
      if (r === spalte) continue
      const faktor = M[r][spalte]
      if (faktor === 0) continue
      for (let c = spalte; c <= n; c++) M[r][c] -= faktor * M[spalte][c]
    }
  }

  return M.map((zeile) => zeile[n])
}

export interface BilanzLoesung {
  /** [stromId][komponenteId] -> Massenstrom in kg/h */
  komponentenMassenstroeme: Record<string, Record<string, number>>
  stromGesamt: Record<string, number>
  stromAnteile: Record<string, Record<string, number>>
  pruefungAnteile: { stromId: string; summeAnteile: number }[]
  /** |Σ Zulauf - Σ Produkt| in kg/h - muss bei korrekter Lösung ~0 sein. */
  bilanzfehlerKgH: number
}

export function loeseBilanz(modell: BilanzModell): BilanzLoesung {
  const fg = freiheitsgrad(modell)
  if (fg.status !== 'bestimmt') throw new Error(fg.hinweis)

  const index = new Map<string, number>()
  let n = 0
  for (const s of modell.stroeme) {
    for (const k of modell.komponenten) index.set(`${s.id}:${k.id}`, n++)
  }
  if (n === 0) throw new Error('Kein Strom oder keine Komponente definiert')

  const A: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const b: number[] = Array(n).fill(0)
  let zeile = 0

  function gleichung(koeffizienten: { schluessel: string; faktor: number }[], rechteSeite: number): void {
    for (const { schluessel, faktor } of koeffizienten) {
      const spalte = index.get(schluessel)
      if (spalte === undefined) throw new Error(`Unbekannter Strom/Komponente-Bezug "${schluessel}"`)
      A[zeile][spalte] += faktor
    }
    b[zeile] = rechteSeite
    zeile++
  }

  for (const block of modell.bloecke) {
    if (block.typ === 'zulauf') {
      for (const k of modell.komponenten) {
        const anteil = block.anteile[k.id] ?? 0
        gleichung([{ schluessel: `${block.ausgang}:${k.id}`, faktor: 1 }], block.massenstromKgH * anteil)
      }
    } else if (block.typ === 'mischer') {
      for (const k of modell.komponenten) {
        gleichung(
          [
            { schluessel: `${block.ausgang}:${k.id}`, faktor: 1 },
            ...block.eingaenge.map((e) => ({ schluessel: `${e}:${k.id}`, faktor: -1 })),
          ],
          0,
        )
      }
    } else if (block.typ === 'splitter') {
      for (const ausgang of block.ausgaenge) {
        for (const k of modell.komponenten) {
          gleichung(
            [
              { schluessel: `${ausgang.strom}:${k.id}`, faktor: 1 },
              { schluessel: `${block.eingang}:${k.id}`, faktor: -ausgang.anteil },
            ],
            0,
          )
        }
      }
    } else if (block.typ === 'trenner') {
      for (const k of modell.komponenten) {
        const anteilKopf = block.anteilKopf[k.id] ?? 0
        gleichung(
          [
            { schluessel: `${block.kopfstrom}:${k.id}`, faktor: 1 },
            { schluessel: `${block.eingang}:${k.id}`, faktor: -anteilKopf },
          ],
          0,
        )
        gleichung(
          [
            { schluessel: `${block.sumpfstrom}:${k.id}`, faktor: 1 },
            { schluessel: `${block.eingang}:${k.id}`, faktor: -(1 - anteilKopf) },
          ],
          0,
        )
      }
    }
    // produkt: terminaler Block, keine eigene Gleichung
  }

  const x = gaussLoesen(A, b)

  const komponentenMassenstroeme: Record<string, Record<string, number>> = {}
  const stromGesamt: Record<string, number> = {}
  const stromAnteile: Record<string, Record<string, number>> = {}
  const pruefungAnteile: { stromId: string; summeAnteile: number }[] = []

  for (const s of modell.stroeme) {
    const proKomponente: Record<string, number> = {}
    for (const k of modell.komponenten) proKomponente[k.id] = x[index.get(`${s.id}:${k.id}`)!]
    komponentenMassenstroeme[s.id] = proKomponente

    const gesamt = Object.values(proKomponente).reduce((sum, v) => sum + v, 0)
    stromGesamt[s.id] = gesamt

    const anteile: Record<string, number> = {}
    for (const k of modell.komponenten) anteile[k.id] = gesamt !== 0 ? proKomponente[k.id] / gesamt : 0
    stromAnteile[s.id] = anteile

    pruefungAnteile.push({ stromId: s.id, summeAnteile: Object.values(anteile).reduce((sum, v) => sum + v, 0) })
  }

  const zulaufSumme = modell.bloecke
    .filter((b): b is Block & { typ: 'zulauf' } => b.typ === 'zulauf')
    .reduce((sum, b) => sum + b.massenstromKgH, 0)
  const produktSumme = modell.bloecke
    .filter((b): b is Block & { typ: 'produkt' } => b.typ === 'produkt')
    .reduce((sum, b) => sum + stromGesamt[b.eingang], 0)

  return {
    komponentenMassenstroeme,
    stromGesamt,
    stromAnteile,
    pruefungAnteile,
    bilanzfehlerKgH: Math.abs(zulaufSumme - produktSumme),
  }
}
