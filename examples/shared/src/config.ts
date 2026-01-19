/**
 * One dev-time API key, shared across every framework example via a single
 * root-level .env (each example's vite.config.ts points `envDir` at the repo
 * root) — see .env.example for setup. Never committed; .gitignore covers
 * .env/.env.*.
 */
export function getDemoApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
  if (!key) {
    console.warn(
      '[google-places-autocomplete example] VITE_GOOGLE_PLACES_API_KEY is not set. ' +
        'Copy .env.example to .env at the repo root and add your own Google Places API (New) key to try the live demo.',
    )
  }
  return key ?? ''
}

export const DEMO_CONFIG = {
  debounceMs: 200,
  minLength: 2,
  languageCode: 'en',
  regionCode: 'us',
} as const
