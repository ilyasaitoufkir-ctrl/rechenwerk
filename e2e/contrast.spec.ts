import { test, expect, type Page } from '@playwright/test'

/**
 * Automatisierter Kontrasttest (Redesign-Auftrag "dunkler Premium-Stil"):
 * Text auf normalen Flächen muss WCAG AA erfüllen (4.5:1, bzw. 3:1 für große/
 * fette Schrift), Text auf Bildkarten mit dunklem Overlay wird zusätzlich per
 * echtem Pixel-Sampling geprüft (reales Ergebnis aus Foto + Overlay + Filter,
 * nicht nur rechnerisch angenommen).
 */

const ROUTEN = [
  '/#/',
  '/#/rechner',
  '/#/bibliothek',
  '/#/einstellungen',
  '/#/assistent',
  '/#/backup',
  '/#/projekte',
  '/#/eigene-stoffe',
  '/#/scan',
  '/#/baukasten',
  '/#/bilanz',
  '/#/formel/reynolds',
  '/#/formel/zylinderschale-ad2000-b1',
]

function relativeLuminanz(r: number, g: number, b: number): number {
  const kanal = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b)
}

function kontrastVerhaeltnis(l1: number, l2: number): number {
  const [hell, dunkel] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hell + 0.05) / (dunkel + 0.05)
}

interface DomBefund {
  text: string
  farbe: string
  hintergrund: string
  fontSize: number
  fontWeight: number
}

async function sammleTextKontraste(page: Page): Promise<DomBefund[]> {
  return page.evaluate(() => {
    function parseRgb(s: string): [number, number, number, number] | null {
      const m = s.match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const teile = m[1].split(',').map((t) => parseFloat(t.trim()))
      return [teile[0] ?? 0, teile[1] ?? 0, teile[2] ?? 0, teile.length > 3 ? teile[3] : 1]
    }

    function effektiverHintergrund(el: Element): [number, number, number] {
      // Erst das Element selbst prüfen (z. B. ein Button mit eigener
      // Hintergrundfarbe), erst dann die Vorfahren hochlaufen.
      let node: Element | null = el
      while (node) {
        const cs = getComputedStyle(node)
        const bg = parseRgb(cs.backgroundColor)
        if (bg && bg[3] > 0.5) return [bg[0], bg[1], bg[2]]
        node = node.parentElement
      }
      return [24, 24, 26] // Seitenhintergrund als Fallback
    }

    const ergebnisse: { text: string; farbe: string; hintergrund: string; fontSize: number; fontWeight: number }[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
    let node = walker.nextNode() as Element | null
    while (node) {
      const el = node
      node = walker.nextNode() as Element | null
      // Nur Blattknoten mit eigenem, nicht-leerem Text (keine Container, die nur Kind-Elemente wrappen)
      const eigenerText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim()
      if (!eigenerText) continue
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      // Bildkarten-Overlay-Text wird separat per Pixel-Sampling geprüft
      if (el.closest('.kategoriebild-overlay, .kategoriebild-img')) continue
      if (el.closest('[aria-hidden="true"]')) continue

      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) continue
      const farbe = parseRgb(cs.color)
      if (!farbe) continue
      const hg = effektiverHintergrund(el)

      ergebnisse.push({
        text: eigenerText.slice(0, 40),
        farbe: `${farbe[0]},${farbe[1]},${farbe[2]}`,
        hintergrund: `${hg[0]},${hg[1]},${hg[2]}`,
        fontSize: parseFloat(cs.fontSize),
        fontWeight: parseInt(cs.fontWeight, 10) || 400,
      })
    }
    return ergebnisse
  })
}

for (const route of ROUTEN) {
  test(`Textkontrast WCAG AA: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto(route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(200)

    const befunde = await sammleTextKontraste(page)
    expect(befunde.length).toBeGreaterThan(0)

    const verstoesse: string[] = []
    for (const b of befunde) {
      const [fr, fg, fb] = b.farbe.split(',').map(Number)
      const [hr, hg, hb] = b.hintergrund.split(',').map(Number)
      const ratio = kontrastVerhaeltnis(relativeLuminanz(fr, fg, fb), relativeLuminanz(hr, hg, hb))
      const grossUndFett = b.fontSize >= 24 || (b.fontSize >= 18.66 && b.fontWeight >= 700)
      const minimum = grossUndFett ? 3.0 : 4.5
      if (ratio < minimum) {
        verstoesse.push(`"${b.text}" ratio=${ratio.toFixed(2)} (min ${minimum}) farbe=${b.farbe} bg=${b.hintergrund}`)
      }
    }
    expect(verstoesse, verstoesse.join('\n')).toEqual([])
  })
}

const KATEGORIEN_SLUGS = [
  'stroemung',
  'waerme',
  'dampf',
  'pumpen',
  'dosierung-mischen',
  'behaelter',
  'druckgeraete',
  'sicherheitsventile',
  'rektifikation',
  'energie-kosten',
]

test('Bildkarten-Overlay: Titeltext auf jedem Kategoriefoto per Pixel-Sampling lesbar (>= 3:1)', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/#/rechner', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  for (const slug of KATEGORIEN_SLUGS) {
    const bild = page.locator(`img[src*="${slug}-1200.webp"]`)
    await expect(bild).toHaveCount(1)
    await bild.scrollIntoViewIfNeeded()
    const box = await bild.boundingBox()
    if (!box) throw new Error(`Keine Bounding Box für ${slug}`)

    // Unterer Streifen der Kachel, wo Titel/Eyebrow über dem stärksten Teil
    // des Overlays liegen - das ist der worst case für Lesbarkeit.
    const probenZone = {
      x: Math.round(box.x + 8),
      y: Math.round(box.y + box.height - 28),
      width: Math.round(Math.min(120, box.width - 16)),
      height: 20,
    }
    const puffer = await page.screenshot({ clip: probenZone })

    const { luminanz } = await page.evaluate(async (base64) => {
      const img = new Image()
      img.src = `data:image/png;base64,${base64}`
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let summe = 0
      let n = 0
      for (let i = 0; i < data.length; i += 4) {
        summe += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        n++
      }
      return { luminanz: summe / n / 255 }
    }, puffer.toString('base64'))

    // Hintergrund-Helligkeit (0..1, sRGB-genähert) der Overlay-Zone hinter dem Titel.
    // Titeltext ist warmes Weiß (#F2EFE9, Luminanz ~0.87) - Kontrast dagegen grob abschätzen.
    const bgApprox = luminanz ** 2.2 // grobe Gamma-Rückrechnung auf lineares Licht für den Vergleich
    const textLin = 0.8657
    const ratio = (Math.max(textLin, bgApprox) + 0.05) / (Math.min(textLin, bgApprox) + 0.05)
    expect(ratio, `Kategorie "${slug}": Overlay-Zone zu hell, Kontrast nur ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0)
  }
})
