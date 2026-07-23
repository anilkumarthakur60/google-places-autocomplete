/**
 * Demo API key resolution, shared across every framework example.
 *
 * Two sources, visitor-entered key first:
 *
 * 1. **Visitor-entered key** — the landing page has an "API key" box whose
 *    value is kept in `localStorage`. Because every playground on the demo
 *    site is same-origin, a key pasted once on the landing powers all of
 *    them. It never leaves the browser except in requests to Google itself.
 * 2. **Build-time `.env` key** — for local dev, a single root-level .env
 *    (each example's vite.config.ts points `envDir` at the repo root); see
 *    .env.example. Never committed; .gitignore covers .env/.env.*.
 */

export const DEMO_API_KEY_STORAGE_KEY = 'gpa-demo-api-key'

function readStoredKey(): string {
  // localStorage can throw (privacy modes, sandboxed iframes) — a demo helper
  // must degrade to "no key", never crash the page.
  try {
    return globalThis.localStorage?.getItem(DEMO_API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** The build-time key, if one was baked in via the root .env. */
export function getEnvApiKey(): string {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY ?? ''
}

/** The visitor-entered key, if one is stored in this browser. */
export function getStoredApiKey(): string {
  return readStoredKey()
}

/** Store a visitor-entered key (landing page "API key" box). */
export function setStoredApiKey(key: string): void {
  try {
    if (key) globalThis.localStorage?.setItem(DEMO_API_KEY_STORAGE_KEY, key)
    else globalThis.localStorage?.removeItem(DEMO_API_KEY_STORAGE_KEY)
  } catch {
    // Storage unavailable — the key still applies for this page via the
    // caller's in-memory state; it just won't survive a reload.
  }
}

export function getDemoApiKey(): string {
  // A key the visitor typed in deliberately outranks whatever the build was
  // made with — explicit action beats build-time default.
  const key = readStoredKey() || getEnvApiKey()
  if (!key) {
    console.warn(
      '[google-places-autocomplete example] No API key available. ' +
        'Paste a Google Places API (New) key into the "API key" box on the demo landing page, ' +
        'or copy .env.example to .env at the repo root for local dev.',
    )
  }
  return key
}

export const DEMO_CONFIG = {
  debounceMs: 200,
  minLength: 2,
  languageCode: 'en',
  regionCode: 'us',
} as const
