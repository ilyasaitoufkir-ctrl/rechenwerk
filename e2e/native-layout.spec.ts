import { test, expect } from '@playwright/test'

/**
 * Automatisierte Prüfung des nativen iPhone-Verhaltens (Redesign-Auftrag):
 * kein horizontaler Überlauf und keine Eingabefelder unter 16px Schriftgröße,
 * auf jeder Route bei 375px (iPhone SE), 393px (iPhone 15/16) und 430px (Pro Max).
 */

const BREITEN = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 15/16', width: 393, height: 852 },
  { name: 'iPhone Pro Max', width: 430, height: 932 },
]

const ROUTEN = [
  '/#/',
  '/#/rechner',
  '/#/bibliothek',
  '/#/einstellungen',
  '/#/verlauf',
  '/#/einheiten',
  '/#/kauf-miete',
  '/#/pumpen-betriebspunkt',
  '/#/rezeptur-skalieren',
  '/#/statistik',
  '/#/regression',
  '/#/fehlerfortpflanzung',
  '/#/mccabe-thiele',
  '/#/assistent',
  '/#/backup',
  '/#/projekte',
  '/#/eigene-stoffe',
  '/#/scan',
  '/#/baukasten',
  '/#/bilanz',
  // Repräsentative Formel-Unterseiten: Standardformel, schichtfeld,
  // komponentenfeld, Druckgeräte-Banner, verschiedene Kategorien.
  '/#/formel/reynolds',
  '/#/formel/waermeleitung-ebene-wand',
  '/#/formel/mischung-massenbilanz',
  '/#/formel/zylinderschale-ad2000-b1',
  '/#/formel/dampf-zustand-dampf',
  '/#/formel/fenske-mindeststufenzahl',
  '/#/formel/sicherheitsventil-gas-dampf',
  '/#/formel/volumen-kugel',
]

for (const breite of BREITEN) {
  test.describe(`${breite.name} (${breite.width}px)`, () => {
    test.use({ viewport: { width: breite.width, height: breite.height } })

    for (const route of ROUTEN) {
      test(`kein horizontaler Überlauf: ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'networkidle' })
        await page.waitForTimeout(150)

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(scrollWidth, `scrollWidth (${scrollWidth}) > clientWidth (${clientWidth}) auf ${route}`).toBeLessThanOrEqual(
          clientWidth + 1,
        )
      })

      test(`alle Eingabefelder >= 16px: ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'networkidle' })
        await page.waitForTimeout(150)

        const zuKleine = await page.evaluate(() => {
          const felder = Array.from(document.querySelectorAll('input, textarea'))
          return felder
            .filter((el) => (el as HTMLElement).offsetParent !== null) // nur sichtbare Felder
            .map((el) => ({
              tag: el.tagName,
              typ: (el as HTMLInputElement).type,
              fontSize: parseFloat(getComputedStyle(el).fontSize),
            }))
            .filter((f) => f.fontSize < 16)
        })
        expect(zuKleine, `Felder mit Schriftgröße < 16px auf ${route}: ${JSON.stringify(zuKleine)}`).toEqual([])
      })
    }
  })
}
