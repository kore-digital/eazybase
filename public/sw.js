/**
 * Minimal service worker for the EazyBase Analytics PWA. Its main job is to make
 * the app installable; it also serves a cached shell if the phone is offline.
 * Analytics data itself is always fetched fresh (network-first) so numbers are
 * never stale — the cache is only a fallback.
 */
const CACHE = 'eb-analytics-v2'

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

// ── Push notifications ──────────────────────────────────────────────────────
// New-lead and follow-up-due alerts, sent from the server via web-push.
self.addEventListener('push', (event) => {
  let data = { title: 'EazyBase', body: 'You have a new update.', url: '/analytics', tag: 'eazybase' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_e) {
    if (event.data) data.body = event.data.text()
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: '/icons/analytics-192.png',
      badge: '/icons/analytics-192.png',
      data: { url: data.url || '/analytics' },
      vibrate: [80, 40, 80],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/analytics'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/analytics') && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
