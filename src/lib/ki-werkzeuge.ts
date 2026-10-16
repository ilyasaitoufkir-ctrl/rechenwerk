/**
 * Werkzeuge (Tools) für den KI-Assistenten - generiert aus der bestehenden
 * Formel-Registry und den Datentabellen, führt aber auch selbst aus
 * (`fuehreWerkzeugAus`). Der Assistent berechnet NIE selbst: jede Zahl, die
 * er nennt, muss aus `formel_berechnen` oder `einheit_umrechnen` stammen.
 *
 * Bewusst kein Import des Anthropic-SDK hier - das ist ein reiner
 * Browser-Client-Code-Pfad, die Werkzeugdefinition folgt nur strukturell
 * der von Anthropic erwarteten Form (name/description/input_schema).
 */
import { alleFormeln, getFormel, sucheFormeln } from '../formulas/registry'
import { alleDatenTabellen, getDatenTabelle, getZeilen } from '../data/registry'
import { getVerifizierung } from './storage'
import { toSI, fromSI, umrechnen, alleEinheiten } from '../units'
import { DRUCKGERAETE_HINWEIS } from '../formulas/druckgeraete/hinweis'

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
    additionalProperties: boolean
  }
}

export interface RechnerLink {
  formelId: string
  ziel: string
  werte: Record<string, string>
  einheiten: Record<string, string>
}

export interface WerkzeugErgebnis {
  /** JSON-serialisierbarer Inhalt für den tool_result-Block an Claude */
  fuerClaude: unknown
  /** Nur bei formel_berechnen gesetzt: Grundlage für den "Im Rechner öffnen"-Button */
  rechnerLink?: RechnerLink
}

function einheitenKompakt(): string {
  return alleEinheiten()
    .map((d) => `${d.dimension} [${d.units.map((u) => u.id).join(', ')}]`)
    .join('; ')
}

function datentabellenKompakt(): string {
  return alleDatenTabellen.map((t) => `${t.id} (${t.name}, ${t.kategorie})`).join('; ')
}

export function erzeugeWerkzeuge(): ToolDefinition[] {
  return [
    {
      name: 'formeln_suchen',
      description:
        'Durchsucht die geprüfte Formelbibliothek von Rechenwerk nach Name, Kategorie oder Stichwort. ' +
        'Immer zuerst aufrufen, um zu prüfen, ob es für eine Frage eine passende Formel gibt, bevor du ' +
        'etwas anderes tust oder aus allgemeinem Wissen antwortest.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Suchbegriff, z. B. "Reynolds" oder "Druckverlust"' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    {
      name: 'formel_details',
      description:
        'Liefert zu einer Formel-ID alle Details: benötigte Eingabegrößen mit ihren Variablen-IDs und ' +
        'gültigen Einheiten-IDs, berechenbare Zielgrößen, Gültigkeitsbereich, Annahmen und Quelle. ' +
        'Immer vor formel_berechnen aufrufen, um die korrekten Variablen-IDs und Einheiten zu kennen - ' +
        'niemals Variablen-IDs oder Einheiten raten.',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Formel-ID aus formeln_suchen, z. B. "reynolds"' },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
    {
      name: 'formel_berechnen',
      description:
        'Berechnet eine Formel aus der Bibliothek mit konkreten Werten. Dies ist die EINZIGE erlaubte Art, ' +
        'ein Zahlenergebnis zu erzeugen - niemals selbst rechnen oder ein Ergebnis schätzen. Vorher ' +
        'formel_details aufrufen. "werte" braucht für jede Eingabevariable (außer der Zielgröße) ' +
        '{"wert": Zahl, "einheit": Einheiten-ID}; fehlt "einheit", wird die Standardeinheit aus ' +
        'formel_details angenommen. Formeln mit mehrschichtiger oder tabellarischer Eingabe ' +
        '(schichtfeld/komponentenfeld) werden abgelehnt - dafür den Nutzer auf den Rechner in der App verweisen.',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Formel-ID' },
          ziel: { type: 'string', description: 'Zu berechnende Variablen-ID (aus zielgroessen)' },
          werte: {
            type: 'object',
            description: 'Bekannte Eingabewerte je Variablen-ID: { "<id>": { "wert": number, "einheit"?: string } }',
          },
        },
        required: ['id', 'ziel', 'werte'],
        additionalProperties: false,
      },
    },
    {
      name: 'einheit_umrechnen',
      description:
        `Rechnet einen Zahlenwert zwischen zwei Einheiten derselben Größe um, ohne eine Formel zu ` +
        `verwenden. Gültige Dimensionen und Einheiten-IDs: ${einheitenKompakt()}.`,
      input_schema: {
        type: 'object',
        properties: {
          wert: { type: 'number' },
          von: { type: 'string', description: 'Einheiten-ID des Eingabewerts, z. B. "bar"' },
          nach: { type: 'string', description: 'Einheiten-ID des gewünschten Ergebnisses, z. B. "Pa"' },
        },
        required: ['wert', 'von', 'nach'],
        additionalProperties: false,
      },
    },
    {
      name: 'stoffdaten_abfragen',
      description:
        `Fragt eine der Richtwert-Datentabellen von Rechenwerk ab (Rauheiten, Rohrmaße DIN 11850, ` +
        `Widerstandsbeiwerte, Stoffdaten Wärme, CO₂-Emissionsfaktoren, Werkstoffdichten). ` +
        `Verfügbare Tabellen: ${datentabellenKompakt()}. Diese Werte sind durchweg Richtwerte mit ` +
        `unsicherer Quellenzuordnung - das beim Zitieren immer dazusagen.`,
      input_schema: {
        type: 'object',
        properties: {
          tabelle: { type: 'string', description: 'Tabellen-ID, z. B. "tabelle-werkstoffdichten"' },
          suchbegriff: { type: 'string', description: 'Optionaler Filter, z. B. "Edelstahl"' },
        },
        required: ['tabelle'],
        additionalProperties: false,
      },
    },
  ]
}

function werkzeugFormelnSuchen(input: Record<string, unknown>): WerkzeugErgebnis {
  const query = typeof input.query === 'string' ? input.query : ''
  const treffer = sucheFormeln(query).slice(0, 15)
  return {
    fuerClaude: {
      anzahlGefunden: treffer.length,
      treffer: treffer.map((f) => ({
        id: f.id,
        name: f.name,
        kategorie: f.kategorie,
        zielgroessen: f.zielgroessen,
        richtwert: f.richtwert ?? false,
        verifiziert: getVerifizierung(f.id)?.verifiziert ?? false,
      })),
    },
  }
}

function werkzeugFormelDetails(input: Record<string, unknown>): WerkzeugErgebnis {
  const id = typeof input.id === 'string' ? input.id : ''
  const formel = getFormel(id)
  if (!formel) {
    return { fuerClaude: { fehler: `Formel "${id}" wurde nicht gefunden. Nutze formeln_suchen.` } }
  }
  return {
    fuerClaude: {
      id: formel.id,
      name: formel.name,
      kategorie: formel.kategorie,
      latex: formel.latex,
      variablen: formel.variablen.map((v) => ({
        id: v.id,
        name: v.name,
        dimension: v.dimension,
        standardEinheit: v.defaultUnit,
        gueltigeEinheiten: alleEinheiten().find((d) => d.dimension === v.dimension)?.units.map((u) => u.id) ?? [],
        min: v.min,
        max: v.max,
      })),
      zielgroessen: formel.zielgroessen,
      zusatzAusgaben: formel.zusatzAusgaben ?? [],
      hatMehrschichtigeEingabe: Boolean(formel.schichtfeld || formel.komponentenfeld),
      gueltigkeit: formel.gueltigkeit,
      annahmen: formel.annahmen,
      quelle: formel.quelle,
      richtwert: formel.richtwert ?? false,
      verifiziert: getVerifizierung(formel.id)?.verifiziert ?? false,
    },
  }
}

function werkzeugFormelBerechnen(input: Record<string, unknown>): WerkzeugErgebnis {
  const id = typeof input.id === 'string' ? input.id : ''
  const ziel = typeof input.ziel === 'string' ? input.ziel : ''
  const werteInput = (input.werte as Record<string, { wert?: number; einheit?: string }> | undefined) ?? {}

  const formel = getFormel(id)
  if (!formel) return { fuerClaude: { fehler: `Formel "${id}" wurde nicht gefunden.` } }
  if (!formel.zielgroessen.includes(ziel)) {
    return {
      fuerClaude: {
        fehler: `Zielgröße "${ziel}" ist ungültig. Gültige Zielgrößen: ${formel.zielgroessen.join(', ')}.`,
      },
    }
  }
  if (formel.schichtfeld || formel.komponentenfeld) {
    return {
      fuerClaude: {
        fehler:
          'Diese Formel verwendet eine mehrschichtige oder tabellarische Eingabe, die der Assistent nicht ' +
          'ausfüllen kann. Verweise den Nutzer auf den Rechner in der App.',
      },
    }
  }

  const ausgabeIds = new Set([ziel, ...(formel.zusatzAusgaben ?? [])])
  const eingabeVariablen = formel.variablen.filter((v) => !ausgabeIds.has(v.id))

  const bekanntSI: Record<string, number> = {}
  const werteFuerRechner: Record<string, string> = {}
  const einheitenFuerRechner: Record<string, string> = {}
  const fehlend: string[] = []

  for (const v of eingabeVariablen) {
    const eingabe = werteInput[v.id]
    if (!eingabe || typeof eingabe.wert !== 'number' || !Number.isFinite(eingabe.wert)) {
      fehlend.push(v.id)
      continue
    }
    const einheit = eingabe.einheit ?? v.defaultUnit
    try {
      bekanntSI[v.id] = toSI(eingabe.wert, v.dimension, einheit)
    } catch {
      return { fuerClaude: { fehler: `Ungültige Einheit "${einheit}" für Variable "${v.id}".` } }
    }
    werteFuerRechner[v.id] = String(eingabe.wert)
    einheitenFuerRechner[v.id] = einheit
  }

  if (fehlend.length > 0) {
    return {
      fuerClaude: {
        fehler: `Es fehlen Werte für: ${fehlend.join(', ')}. Frage den Nutzer danach - erfinde keine Werte.`,
      },
    }
  }

  let roh: Record<string, number>
  try {
    roh = formel.compute(bekanntSI, ziel)
  } catch (e) {
    return { fuerClaude: { fehler: e instanceof Error ? e.message : 'Unbekannter Rechenfehler.' } }
  }
  if (Object.values(roh).some((x) => !Number.isFinite(x))) {
    return {
      fuerClaude: {
        fehler: 'Ergebnis ist nicht definiert (z. B. Division durch 0 oder außerhalb des gültigen Bereichs).',
      },
    }
  }

  const warnungen = formel.warnungen?.(bekanntSI, ziel, roh) ?? []
  const verifiziert = getVerifizierung(formel.id)?.verifiziert ?? false

  const ergebnisse = Array.from(ausgabeIds).map((outId) => {
    const v = formel.variablen.find((x) => x.id === outId)!
    return {
      id: outId,
      name: v.name,
      wertSI: roh[outId],
      standardEinheit: v.defaultUnit,
      wertInStandardeinheit: fromSI(roh[outId], v.dimension, v.defaultUnit),
    }
  })

  return {
    fuerClaude: {
      formel: formel.name,
      kategorie: formel.kategorie,
      ergebnisse,
      warnungen,
      gueltigkeit: formel.gueltigkeit,
      quelle: formel.quelle,
      richtwert: formel.richtwert ?? false,
      verifiziert,
      ...(formel.kategorie === 'Druckgeräte' ? { pflichthinweis: DRUCKGERAETE_HINWEIS } : {}),
    },
    rechnerLink: { formelId: formel.id, ziel, werte: werteFuerRechner, einheiten: einheitenFuerRechner },
  }
}

function werkzeugEinheitUmrechnen(input: Record<string, unknown>): WerkzeugErgebnis {
  const wert = typeof input.wert === 'number' ? input.wert : NaN
  const von = typeof input.von === 'string' ? input.von : ''
  const nach = typeof input.nach === 'string' ? input.nach : ''
  if (!Number.isFinite(wert)) return { fuerClaude: { fehler: '"wert" muss eine Zahl sein.' } }
  try {
    const r = umrechnen(wert, von, nach)
    return { fuerClaude: { ergebnis: r.ergebnis, dimension: r.dimension } }
  } catch (e) {
    return { fuerClaude: { fehler: e instanceof Error ? e.message : 'Umrechnung fehlgeschlagen.' } }
  }
}

function werkzeugStoffdatenAbfragen(input: Record<string, unknown>): WerkzeugErgebnis {
  const tabelle = typeof input.tabelle === 'string' ? input.tabelle : ''
  const suchbegriff = typeof input.suchbegriff === 'string' ? input.suchbegriff : undefined
  const tab = getDatenTabelle(tabelle)
  if (!tab) {
    return {
      fuerClaude: {
        fehler: `Tabelle "${tabelle}" ist unbekannt. Gültige IDs: ${alleDatenTabellen.map((t) => t.id).join(', ')}.`,
      },
    }
  }
  const zeilen = getZeilen(tabelle, suchbegriff).slice(0, 50)
  return { fuerClaude: { tabelle: tab.name, kategorie: tab.kategorie, quelle: tab.quelle, zeilen } }
}

export function fuehreWerkzeugAus(name: string, input: Record<string, unknown>): WerkzeugErgebnis {
  switch (name) {
    case 'formeln_suchen':
      return werkzeugFormelnSuchen(input)
    case 'formel_details':
      return werkzeugFormelDetails(input)
    case 'formel_berechnen':
      return werkzeugFormelBerechnen(input)
    case 'einheit_umrechnen':
      return werkzeugEinheitUmrechnen(input)
    case 'stoffdaten_abfragen':
      return werkzeugStoffdatenAbfragen(input)
    default:
      return { fuerClaude: { fehler: `Unbekanntes Werkzeug "${name}".` } }
  }
}

/** Nur für Tests/Diagnose: Anzahl Formeln, die der Assistent grundsätzlich berechnen kann. */
export function anzahlBerechenbarerFormeln(): number {
  return alleFormeln.filter((f) => !f.schichtfeld && !f.komponentenfeld).length
}
