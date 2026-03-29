# Session tokens & billing

Google bills Places Autocomplete (New) and Place Details (New) **per session**, not per request, as long as every request in that session shares one session token. A session starts on the first keystroke and ends when a place is selected (or the session is otherwise abandoned) — after that, a fresh token must be generated for the next search.

Get this wrong and you're billed for autocomplete requests and the details lookup as two separate line items instead of one session. `core` handles the whole lifecycle for you:

1. The first call to `setQuery` generates a session token (`crypto.randomUUID()`, with a fallback for environments without it).
2. Every subsequent autocomplete request in that session reuses the same token.
3. When a suggestion is selected, the Place Details (New) request is sent with that **same** token — one session, one bill.
4. The token is discarded immediately after, so the next search starts clean.

None of this is configurable, because there's no correct reason to configure it differently — it's just how the API is supposed to be used.

## Resolving place details automatically

By default, selecting a suggestion triggers a Place Details (New) fetch using the session token above, giving you a full [`PlaceDetails`](/api/core#placedetails) object (formatted address, coordinates, address components) rather than just the raw suggestion text. If you only need the suggestion itself, disable this:

```ts
{
  resolveDetails: false
}
```

You can also narrow the [field mask](https://developers.google.com/maps/documentation/places/web-service/place-details) requested for that details call:

```ts
{
  placeFields: ['id', 'displayName', 'formattedAddress'] // default also includes location + addressComponents
}
```

Smaller field masks reduce Google's per-request cost tier for the Place Details call.

## Proxying through your own backend

Every wrapper accepts a `fetcher` — the exact shape of `fetch` — so you can route requests through your own server instead of calling `places.googleapis.com` directly from the browser. This is the right call if you don't want to expose an API key client-side at all:

```ts
{
  fetcher: (input, init) => fetch(`/api/places-proxy?url=${encodeURIComponent(String(input))}`, init)
}
```

Your proxy endpoint attaches the real key server-side and forwards the request. `apiKey` becomes optional in this case — `core` only requires it when no custom `fetcher` is supplied.
