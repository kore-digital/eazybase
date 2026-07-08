/**
 * Minimal service worker for the EazyBase Analytics PWA. Its main job is to make
 * the app installable; it also serves a cached shell if the phone is offline.
 * Analytics data itself is always fetched fresh (network-first) so numbers are
 * never stale — the cache is only a fallback.
 */
const CACHE = 'eb-analytics-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/analytics'])).catch(() => {}))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/analytics')) return

  // Network-first: fresh data when online, cached shell when not.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/analytics'))),
  )
})
