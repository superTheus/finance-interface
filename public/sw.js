const CACHE_NAME = 'showroom-pwa-v4'
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.pathname.endsWith('/manifest.webmanifest')) {
    return
  }

  if (request.method !== 'GET') {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (url.origin !== self.location.origin) {
    return
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    cache.put(request, response.clone())
    return response
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match('/offline.html')) ||
      (await cache.match('/index.html'))
    )
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    void fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
      })
      .catch(() => undefined)

    return cached
  }

  const response = await fetch(request).catch(() => undefined)

  if (response?.ok) {
    cache.put(request, response.clone())
  }

  return response || Response.error()
}
