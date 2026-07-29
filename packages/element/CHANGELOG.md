# @anil-labs/google-places-autocomplete-element

## 0.2.0

### Minor Changes

- 4058665: Add standalone browser builds for no-bundler/CDN usage.
  - `core` now also ships an IIFE build (`dist/index.global.js`, exposed as `window.GooglePlacesAutocompleteCore`) referenced by the `unpkg`/`jsdelivr` fields.
  - `element` now ships a self-contained IIFE build that bundles the engine, inlines the stylesheet, and auto-registers `<gpa-autocomplete>` — so a single `<script src="https://unpkg.com/@anil-labs/google-places-autocomplete-element">` tag works with zero setup.
  - The element now self-injects its stylesheet on connect (in every build), so a separate `@anil-labs/google-places-autocomplete-core/styles.css` import is no longer required when using the element.

- 74f1ca1: Close the suggestion panel on an outside click (previously only `Escape` or a selection closed it), show a loading indicator while a search is in flight, and show a "No results found" message instead of silently hiding when a search returns nothing.

  Fixed a bug where the Web Component package (`@anil-labs/google-places-autocomplete-element`) threw `ReferenceError: HTMLElement is not defined` when imported during server-side rendering (Next.js/Nuxt/SvelteKit server-render the whole module graph by default, even for client-only code).

- 9a3ae6a: **Customization release: live config, custom rendering, i18n labels, and the full Places (New) request surface.**

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

### Patch Changes

- Updated dependencies [4058665]
- Updated dependencies [74f1ca1]
- Updated dependencies [9a3ae6a]
  - @anil-labs/google-places-autocomplete-core@0.2.0
