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

## Wichtigstes Prinzip

Lieber eine Formel weniger als eine falsche oder ungeprüfte. Jede Formel
braucht eine echte Quelle (Standardwerk). Ist die genaue Kapitel-/
Gleichungsnummer nicht sicher, nur das Werk angeben und `quelle.unsicher =
true` setzen – niemals Seitenzahlen erfinden.
