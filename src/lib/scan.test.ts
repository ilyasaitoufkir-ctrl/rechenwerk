import { describe, it, expect } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { berechnungenAusVerlauf, fehlerAusVerlauf, letzterAssistentText, baueLoesenInstruktion } from './scan'
import { fuehreWerkzeugAus } from './ki-werkzeuge'
import type { AufgabeErkennung } from './ki-werkzeuge'

function verlaufMitErfolgreicherBerechnung(): Anthropic.MessageParam[] {
  const input = {
    id: 'reynolds',
    ziel: 'Re',
    werte: { v: { wert: 2, einheit: 'ms' }, d: { wert: 50, einheit: 'mm' }, nu: { wert: 1, einheit: 'mm2s' } },
  }
  const ergebnis = fuehreWerkzeugAus('formel_berechnen', input).fuerClaude
  return [
    { role: 'user', content: 'Berechne Re.' },
    {
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'toolu_1', name: 'formel_berechnen', input, caller: { type: 'direct' } }],
    },
    {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: JSON.stringify(ergebnis), is_error: false }],
    },
    { role: 'assistant', content: [{ type: 'text', text: 'Re = 100, turbulente Strömung.', citations: [] }] },
  ]
}

describe('berechnungenAusVerlauf', () => {
  it('extrahiert Formel, bekannte Werte (SI) und Ergebnis (SI) aus einem erfolgreichen formel_berechnen-Aufruf', () => {
    const [b] = berechnungenAusVerlauf(verlaufMitErfolgreicherBerechnung())
    expect(b.formel.id).toBe('reynolds')
    expect(b.ziel).toBe('Re')
    expect(b.bekanntSI.v).toBeCloseTo(2, 6)
    expect(b.bekanntSI.d).toBeCloseTo(0.05, 6)
    expect(b.bekanntSI.nu).toBeCloseTo(1e-6, 9)
    expect(b.ergebnisSI.Re).toBeCloseTo(100000, 3)
  })

  it('ignoriert fehlgeschlagene Werkzeugaufrufe (kein Ergebnis zum Speichern)', () => {
    const verlauf: Anthropic.MessageParam[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'x', name: 'formel_berechnen', input: { id: 'reynolds', ziel: 'Re', werte: {} }, caller: { type: 'direct' } },
        ],
      },
      {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'x', content: JSON.stringify({ fehler: 'Es fehlen Werte für: v, d, nu.' }), is_error: true }],
      },
    ]
    expect(berechnungenAusVerlauf(verlauf)).toHaveLength(0)
  })

  it('liefert eine leere Liste ohne Werkzeugaufrufe', () => {
    expect(berechnungenAusVerlauf([{ role: 'user', content: 'Hallo' }])).toHaveLength(0)
  })
})

describe('fehlerAusVerlauf', () => {
  it('sammelt die Fehlermeldungen aller is_error-Werkzeugergebnisse - für "nicht lösbare Teile"', () => {
    const verlauf: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'x', content: JSON.stringify({ fehler: 'Es fehlen Werte für: rho.' }), is_error: true }],
      },
    ]
    expect(fehlerAusVerlauf(verlauf)).toEqual(['Es fehlen Werte für: rho.'])
  })

  it('liefert eine leere Liste, wenn kein Werkzeugaufruf fehlgeschlagen ist', () => {
    expect(fehlerAusVerlauf(verlaufMitErfolgreicherBerechnung())).toHaveLength(0)
  })
})

describe('letzterAssistentText', () => {
  it('liefert den letzten Freitext des Assistenten', () => {
    expect(letzterAssistentText(verlaufMitErfolgreicherBerechnung())).toBe('Re = 100, turbulente Strömung.')
  })

  it('liefert einen leeren String ohne Assistenten-Nachricht', () => {
    expect(letzterAssistentText([{ role: 'user', content: 'Hallo' }])).toBe('')
  })
})

describe('baueLoesenInstruktion', () => {
  it('überträgt die übergebene Aufgabenstruktur unverändert in die Instruktion', () => {
    const aufgabe: AufgabeErkennung = {
      gegeben: [{ groesse: 'Innendurchmesser', wert: 77, einheit: 'mm', unsicher: false }],
      gesucht: ['Reynoldszahl'],
      annahmen: ['Newtonsches Fluid'],
    }
    const text = baueLoesenInstruktion(aufgabe)
    expect(text).toContain('Innendurchmesser = 77 mm')
    expect(text).toContain('Gesucht: Reynoldszahl')
    expect(text).toContain('Annahmen: Newtonsches Fluid')
  })

  it('markiert unsicher erkannte Werte ausdrücklich in der Instruktion', () => {
    const aufgabe: AufgabeErkennung = {
      gegeben: [{ groesse: 'Volumenstrom', wert: 12, einheit: 'm3h', unsicher: true }],
      gesucht: ['x'],
      annahmen: [],
    }
    expect(baueLoesenInstruktion(aufgabe)).toContain('(unsicher gelesen)')
  })

  it('verwendet einen nach der Erkennung korrigierten Wert - der ursprünglich erkannte taucht nicht mehr auf', () => {
    const erkannt: AufgabeErkennung = {
      gegeben: [{ groesse: 'Innendurchmesser', wert: 70, einheit: 'mm', unsicher: true }],
      gesucht: ['Reynoldszahl'],
      annahmen: [],
    }
    const korrigiert: AufgabeErkennung = {
      ...erkannt,
      gegeben: [{ ...erkannt.gegeben[0], wert: 77, unsicher: false }],
    }
    const text = baueLoesenInstruktion(korrigiert)
    expect(text).toContain('Innendurchmesser = 77 mm')
    expect(text).not.toContain('70 mm')
  })
})
