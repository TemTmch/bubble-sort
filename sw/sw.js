/* Bubble Sort service worker: the game works offline once the site has been opened.
   - app files (html, js, css, icons) are pre-cached at install;
   - pictures from word sets are cached as they are shown;
   - database calls are never cached here (the pupil page keeps its own copy of the class). */
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const SHELL = "bs-shell-" + VERSION;
const IMG = "bs-img-v1";
const IMG_MAX = 400;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("bs-shell-") && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trimImages() {
  const c = await caches.open(IMG), keys = await c.keys();
  for (let i = 0; i < keys.length - IMG_MAX; i++) await c.delete(keys[i]);
}
async function navigate(req) {
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 5000);
    const res = await fetch(req, { signal: ctl.signal }); clearTimeout(timer);
    if (res.ok) { const c = await caches.open(SHELL); c.put("index.html", res.clone()); }
    return res;
  } catch (err) {
    return (await caches.match("index.html", { ignoreSearch: true })) || (await caches.match("./", { ignoreSearch: true })) || Response.error();
  }
}
async function asset(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === "basic") { const c = await caches.open(SHELL); c.put(req, res.clone()); }
  return res;
}
async function picture(req) {
  const c = await caches.open(IMG), hit = await c.match(req);
  const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") { c.put(req, res.clone()).then(trimImages); } return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") e.respondWith(navigate(req));
    else if (url.pathname.startsWith(new URL("./", self.location).pathname)) e.respondWith(asset(req));
  } else if (url.pathname.includes("/storage/v1/object/public/")) {
    e.respondWith(picture(req));
  }
});
