// Service worker - F1 Career
// Serve a una cosa sola: far partire il gioco senza rete, dall'icona sulla
// schermata iniziale. La cache si chiama con la versione, quindi pubblicare
// una versione nuova butta via quella vecchia da sola.
//
// REGOLA: a ogni pubblicazione si cambia VERSIONE. Se non si cambia, il
// telefono continua a servire il file vecchio dalla cache e sembra che le
// modifiche non siano mai state fatte.
const VERSIONE = "0.70.0";
const CACHE = "f1career-" + VERSIONE;

const GUSCIO = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(GUSCIO))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // Le geometrie dei circuiti arrivano da un dominio esterno al primo avvio e
  // finiscono gia' in localStorage: intercettarle qui non serve e romperebbe
  // il fallback locale del gioco.
  if (e.request.method !== "GET" || u.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(r => {
        if (r && r.ok && r.type === "basic") {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return r;
      }).catch(() => caches.match("./index.html"));   // offline: torna al gioco
    })
  );
});
