# Rechenwerk – Anleitung: Eine neue Formel hinzufügen

Rechenwerk generiert Rechner automatisch aus der Formel-Registry. Um eine neue
Formel hinzuzufügen, brauchst du **eine einzige neue Datei** (plus einen
Eintrag in der Registry) – es entsteht automatisch: Eingabefelder mit
Einheitenwahl, Ergebnisanzeige, Rechenweg, Gültigkeitsbereich, Quelle,
Verifizierungs-Badge und die Aufnahme in Suche/Bibliothek.

## Schritt 1: Datei anlegen

Lege unter `src/formulas/<kategorie>/<id>.ts` eine neue Datei an, z. B.
`src/formulas/stroemung/neue-formel.ts`:

```ts
import type { Formula } from '../../types/formula'

export const neueFormel: Formula = {
  id: 'neue-formel',
  name: 'Meine neue Formel',
  kategorie: 'Strömung & Rohrleitungen',
  stichworte: ['stichwort1', 'stichwort2'],
  latex: 'y = a \\cdot x',

  // Alle Variablen, die in der Formel vorkommen - auch die Zielgröße(n)
  // und etwaige Zusatzausgaben müssen hier mit vollständigen Metadaten stehen.
  variablen: [
    { id: 'a', symbol: 'a', name: 'Faktor', dimension: 'dimensionless', defaultUnit: '_' },
    { id: 'x', symbol: 'x', name: 'Eingangsgröße', dimension: 'length', defaultUnit: 'm' },
    { id: 'y', symbol: 'y', name: 'Ergebnis', dimension: 'length', defaultUnit: 'm' },
  ],

  // Welche Variablen-IDs als "unbekannt/zu berechnen" wählbar sind.
  // Mehrere Einträge erzeugen automatisch eine "Berechnen:"-Auswahl im Rechner.
  zielgroessen: ['y'],

  // Reine Funktion in SI-Einheiten: bekannte Werte (alle Variablen außer
  // Zielgröße und zusatzAusgaben) -> { [ziel]: wert, ...zusatzAusgaben }
  compute: (bekannt, ziel): Record<string, number> => {
    if (ziel !== 'y') throw new Error(`Unbekannte Zielgröße "${ziel}"`)
    return { y: bekannt.a * bekannt.x }
  },

  gueltigkeit: 'Beschreibe hier, für welchen Bereich die Formel gilt',
  annahmen: ['Annahme 1', 'Annahme 2'],
  quelle: { werk: 'Name des Standardwerks', kapitel: 'Kapitel/Gleichungsnummer' },

  // Nur setzen, wenn du dir bei Kapitel/Gleichungsnummer nicht sicher bist:
  // quelle: { werk: '...', unsicher: true }

  // Nur setzen, wenn die Formel auf Erfahrungswerten statt exakter Herleitung beruht
  // richtwert: true,

  // Optional: Plausibilitätsprüfungen, die Warnhinweise zurückgeben (blockieren nicht)
  warnungen: (bekannt, ziel, ergebnis) => {
    const warnungen: string[] = []
    if (ergebnis.y < 0) warnungen.push('Negatives Ergebnis - Eingabe prüfen.')
    return warnungen
  },

  // Pflicht: ein nachrechenbares Beispiel in SI-Einheiten
  beispiel: {
    bekannt: { a: 2, x: 3 },
    ziel: 'y',
    erwartet: { y: 6 },
    toleranzRelativ: 1e-6, // optional, Standard 1e-6
  },
}
```

### Mehrere Zielgrößen (nach jeder Größe auflösbar)

Wenn die Formel nach mehreren Größen auflösbar sein soll (wie z. B. die
Kontinuitätsgleichung `V̇ = A·v`), trage alle lösbaren Variablen in
`zielgroessen` ein und unterscheide im `compute` nach `ziel`:

```ts
zielgroessen: ['V_dot', 'A', 'v'],
compute: (bekannt, ziel): Record<string, number> => {
  if (ziel === 'V_dot') return { V_dot: bekannt.A * bekannt.v }
  if (ziel === 'A') return { A: bekannt.V_dot / bekannt.v }
  if (ziel === 'v') return { v: bekannt.V_dot / bekannt.A }
  throw new Error(`Unbekannte Zielgröße "${ziel}"`)
}
```

### Zusatzausgaben (mehrere Ergebnisse gleichzeitig)

Wenn neben der Zielgröße immer ein weiterer Wert mitberechnet werden soll
(wie die Druckhöhe `h` neben dem Druckverlust `Δp`), trage diese Variable in
`zusatzAusgaben` ein und gib sie zusätzlich im `compute`-Ergebnis zurück:

```ts
zielgroessen: ['dp'],
zusatzAusgaben: ['h'],
compute: (bekannt, ziel): Record<string, number> => {
  const dp = /* ... */
  const h = dp / (bekannt.rho * G)
  return { dp, h }
}
```

## Schritt 2: In der Registry eintragen

Öffne `src/formulas/registry.ts` und ergänze Import + Eintrag:

```ts
import { neueFormel } from './stroemung/neue-formel'

export const alleFormeln: Formula[] = [
  // ...bestehende Formeln,
  neueFormel,
]
```

Das war's. Rechner, Suche, Formelbibliothek und der Pflichtfelder-Test in
`src/formulas/registry.test.ts` greifen automatisch auf die Registry zu.

## Schritt 3: Tests schreiben

Lege `src/formulas/<kategorie>/<id>.test.ts` an mit mindestens:

1. Einem Test, der das hinterlegte `beispiel` reproduziert.
2. Einem Test mit einem **unabhängig von Hand nachgerechneten** Wert
   (Handrechnung als Kommentar im Test).

```ts
import { describe, it, expect } from 'vitest'
import { neueFormel } from './neue-formel'

describe('Meine neue Formel', () => {
  it('reproduziert das hinterlegte Beispiel', () => {
    const { bekannt, ziel, erwartet } = neueFormel.beispiel
    const ergebnis = neueFormel.compute(bekannt, ziel)
    expect(ergebnis.y).toBeCloseTo(erwartet.y, 6)
  })

  it('Handrechnung: a=5, x=2 (unabhängig vom Beispiel)', () => {
    // Handrechnung: y = a*x = 5*2 = 10
    const ergebnis = neueFormel.compute({ a: 5, x: 2 }, 'y')
    expect(ergebnis.y).toBeCloseTo(10, 9)
  })
})
```

Dann: `npm run test` – ohne grüne Tests gilt eine neue Formel nicht als fertig.

## Mehrschichtige Eingaben (z. B. Wandaufbau)

Wenn eine Formel eine Summe über beliebig viele Schichten braucht (wie
Σ s_i/λ_i bei der Wärmeleitung durch eine Wand), trage eine Variable mit der
Dimension `thermalResistanceArea` ein und referenziere sie über
`schichtfeld`:

```ts
variablen: [
  // ...
  { id: 'R', symbol: '\\sum s_i/\\lambda_i', name: 'Wandschichten', dimension: 'thermalResistanceArea', defaultUnit: 'm2KW' },
],
schichtfeld: { zielVariable: 'R', dickeName: 'Dicke s', leitfaehigkeitName: 'Wärmeleitfähigkeit λ' },
```

Der Rechner zeigt dafür automatisch eine Liste mit Dicke + Wärmeleitfähigkeit
je Schicht (beliebig viele, add/remove) statt eines einzelnen Eingabefelds
und berechnet die Summe selbst in SI. Im `compute` kommt `R` ganz normal als
fertiger SI-Wert in `bekannt.R` an. Siehe `src/formulas/waerme/waermeleitung-ebene-wand.ts`.

## Komponententabellen (z. B. Mischungen)

Für Formeln mit einer Summe über Produkte mehrerer Spalten je Zeile (z. B.
w_Mix = Σ(m_i·w_i)/Σm_i) gibt es `komponentenfeld`: beliebig viele Zeilen mit
frei definierten Spalten, aus denen eine oder mehrere Summenvariablen
berechnet werden.

```ts
komponentenfeld: {
  spalten: [
    { id: 'm', name: 'Masse', dimension: 'mass', defaultUnit: 'kg' },
    { id: 'w', name: 'Massenanteil', dimension: 'dimensionless', defaultUnit: 'pct' },
  ],
  summen: [
    { zielVariable: 'summeM', spalten: ['m'] },        // Σ m_i
    { zielVariable: 'summeMW', spalten: ['m', 'w'] },  // Σ m_i·w_i
  ],
},
```

`summeM` und `summeMW` müssen auch ganz normal in `variablen` stehen (mit
einer plausiblen Dimension für die interne Anzeige im Rechenweg) und kommen
in `compute` als fertige SI-Summen an - siehe
`src/formulas/dosierung-mischen/mischung-massenbilanz.ts` (zwei Spalten) und
`mischtemperatur.ts` (drei Spalten, Σm·c·T).

## Pflichthinweis für eine ganze Kategorie (z. B. Druckgeräte)

Wenn eine komplette Kategorie denselben nicht wegklickbaren Warnhinweis
braucht (so bei "Druckgeräte", siehe
`src/formulas/druckgeraete/hinweis.ts` und
`src/components/DruckgeraeteBanner.tsx`):

1. Den Wortlaut als Konstante in einer `hinweis.ts` der Kategorie ablegen.
2. In jeder Formel dieser Kategorie als ersten Eintrag in `annahmen`
   referenzieren, damit er im Rechenweg jedes Ergebnisses auftaucht.
3. In `Calculator.tsx` eine Bedingung auf `formel.kategorie === '<Name>'`
   ergänzen, die das Banner über der Formel einblendet.

Bei sicherheitsrelevanten Formeln außerdem: Werte außerhalb des
mathematischen Gültigkeitsbereichs (z. B. eine Wanddickenformel mit
negativem Nenner) im `compute` per `throw` hart ablehnen statt nur über
`warnungen` zu warnen - und wenn eine normative Anwendungsgrenze (z. B.
ein Wanddicken-/Durchmesser-Verhältnis) nicht mit Sicherheit bekannt ist,
lieber auf die Prüfung verzichten und das im `gueltigkeit`-Feld offen
benennen, als eine unsichere Zahl zu erfinden.

## Neue Einheiten oder Dimensionen

Alle Umrechnungsfaktoren liegen in `src/units/index.ts`, jede Dimension mit
eigener SI-Basiseinheit. Eine neue Einheit hinzufügen heißt: in der
passenden `*Units`-Liste einen Eintrag über den `linear(id, label, faktor)`-
Helfer (oder eine eigene `toSI`/`fromSI`-Funktion bei nichtlinearer
Umrechnung, siehe Temperatur) ergänzen. Für eine komplett neue Dimension:
Liste anlegen, in `dimensions` eintragen, `DimensionId`-Union erweitern.

## Neue Datentabellen (Rauheiten, Rohre, Einbauten)

Liegen unter `src/data/`. Jede Tabelle trägt ihre eigene `Quelle` und ist als
Richtwert gekennzeichnet, wenn die Werte streuen. Bei Unsicherheit über die
genaue Kapitel-/Tabellennummer: `quelle.unsicher = true` setzen statt eine
Seitenzahl zu erfinden.

## KI-Assistent (Werkzeuge auf Basis der Registry)

Der Assistent (`src/pages/Assistent.tsx`) rechnet nie selbst - er ruft
ausschließlich Werkzeuge auf, die gegen die bestehende Formel-Registry und
Datentabellen arbeiten. Eine neue Formel oder Datentabelle ist damit
automatisch auch für den Assistenten nutzbar, ohne dass dort etwas
angepasst werden muss:

- `src/lib/ki-werkzeuge.ts` definiert die 5 Werkzeuge (`formeln_suchen`,
  `formel_details`, `formel_berechnen`, `einheit_umrechnen`,
  `stoffdaten_abfragen`) und führt sie clientseitig aus - `formel_berechnen`
  ruft dabei exakt denselben `formel.compute()` wie der normale Rechner auf,
  nur mit Werten aus dem Werkzeugaufruf statt aus Eingabefeldern.
- `src/lib/ki-client.ts` orchestriert den Werkzeugaufruf-Loop (max. 8
  Runden) und spricht dafür `api/assistent.ts` an.
- `api/assistent.ts` ist eine Vercel Serverless Function und bewusst ein
  reiner Proxy zur Anthropic Messages API: keine Formellogik, nur
  Zugangscode-Prüfung, Größenlimits und Weiterleitung der vom Client
  mitgeschickten Werkzeugdefinitionen. Der API-Schlüssel
  (`ANTHROPIC_API_KEY`) und der Zugangscode (`APP_ACCESS_TOKEN`) liegen
  ausschließlich als Vercel-Umgebungsvariablen vor, nie im Frontend.

Bei Druckgeräte-Formeln gibt `formel_berechnen` den `DRUCKGERAETE_HINWEIS`
in jedem Ergebnis mit zurück, und der System-Prompt weist das Modell an,
ihn zu wiederholen - derselbe Pflichthinweis wie im Rechner, nur über eine
zweite Stelle (System-Prompt + Werkzeugergebnis statt Banner) sichergestellt.

## Wichtigstes Prinzip

Lieber eine Formel weniger als eine falsche oder ungeprüfte. Jede Formel
braucht eine echte Quelle (Standardwerk). Ist die genaue Kapitel-/
Gleichungsnummer nicht sicher, nur das Werk angeben und `quelle.unsicher =
true` setzen – niemals Seitenzahlen erfinden.
