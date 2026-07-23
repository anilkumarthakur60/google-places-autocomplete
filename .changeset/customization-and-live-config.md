---
'@anil-labs/google-places-autocomplete-core': minor
'@anil-labs/google-places-autocomplete-vue': minor
'@anil-labs/google-places-autocomplete-react': minor
'@anil-labs/google-places-autocomplete-svelte': minor
'@anil-labs/google-places-autocomplete-solid': minor
'@anil-labs/google-places-autocomplete-element': minor
---

**Customization release: live config, custom rendering, i18n labels, and the full Places (New) request surface.**

Core:

- `controller.setConfig(patch)` — merge new config (API key, region, debounce, …) into a live controller; in-flight requests from the old config are aborted. `controller.clear()` resets query/suggestions/selection and starts a fresh billing session.
- New request options passed straight through to Google: `includedPrimaryTypes` (e.g. `['locality']` for a city picker), `locationRestriction` (hard filter, same shapes as `locationBias`), and `origin` (each suggestion then carries `distanceMeters`).
- `Suggestion` now exposes `textMatches`/`mainTextMatches` (the typed-part ranges, for Google-style bolding), `distanceMeters`, and `raw` (the untouched `placePrediction`).
- `PlaceDetails.raw` carries the full Place Details response — every field you request via `placeFields` is now actually reachable, not just the five mapped ones.
- Place Details requests are localized with the configured `languageCode`/`regionCode`, and are abortable like autocomplete requests.
- `PlacesAutocompleteLabels` + `DEFAULT_LABELS` exported for the wrappers' i18n.

Wrappers:

- **Custom suggestion rendering** everywhere: `renderSuggestion` prop (React, Solid), `suggestion` scoped slot (Vue), `suggestion` snippet (Svelte), `renderOption` property (element). The wrapper keeps the `<li>`, ARIA wiring and selection handling — you control the content.
- **`labels` prop** on every wrapper (element: `searching-text` / `no-results-text` attributes) to override the built-in "Searching…" / "No results found" / placeholder strings.
- **Live config**: changing `apiKey`, `regionCode`, `debounceMs`, … on a mounted component now applies to the next request via `setConfig` — no remount needed. The element's observed attributes are all live now (they were read once at first connection before).
- All new core options (`includedPrimaryTypes`, `locationRestriction`, `origin`, `placeFields`) are exposed as props/properties on every wrapper.
