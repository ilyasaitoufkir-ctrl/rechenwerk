import { test, expect } from '@playwright/test'

/**
 * Offline-Test (Redesign-Auftrag): Kategoriebilder sind vom Service Worker
 * vorab gecacht (siehe vite.config.ts globPatterns inkl. webp) und müssen
 * auch ohne Netzverbindung laden.
 */
test('Kategoriebilder laden ohne Netzverbindung (Service-Worker-Cache)', async ({ page, context }) => {
  await page.goto('/#/rechner', { waitUntil: 'networkidle' })

  // Auf aktiven, kontrollierenden Service Worker warten und dann darauf, dass
  // die Kategoriebilder tatsächlich im Cache Storage liegen (Precaching ist
  // asynchron zum Seitenaufbau).
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForFunction(async () => {
    const namen = await caches.keys()
    for (const name of namen) {
      const cache = await caches.open(name)
      const keys = await cache.keys()
      if (keys.some((k) => k.url.includes('/images/kategorien/') && k.url.includes('.webp'))) return true
    }
    return false
  }, { timeout: 15_000 })

  await context.setOffline(true)
  await page.reload({ waitUntil: 'networkidle' })

  const bild = page.locator('img[src*="/images/kategorien/stroemung-"]').first()
  await expect(bild).toBeVisible()
  const natuerlicheBreite = await bild.evaluate((el: HTMLImageElement) => el.naturalWidth)
  expect(natuerlicheBreite, 'Kategoriebild ist offline nicht geladen (naturalWidth 0)').toBeGreaterThan(0)

  await context.setOffline(false)
})
