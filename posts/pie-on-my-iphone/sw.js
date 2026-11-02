// GitHub Pages can't set response headers, but Pie's tab runtime wants the page
// cross-origin isolated, which takes two of them (COOP and COEP). This service
// worker adds them to every response from this site, for this post's folder only.
// Same idea as coi-serviceworker (github.com/gzuidhof/coi-serviceworker).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
  event.respondWith(withHeaders(request));
});

async function withHeaders(request) {
  const response = await fetch(request);
  if (response.status === 0) return response; // a redirect or opaque response: pass it on as is
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
