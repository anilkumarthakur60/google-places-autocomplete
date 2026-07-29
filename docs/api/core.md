# Core (`@anil-labs/google-places-autocomplete-core`)

Framework-agnostic engine. Every wrapper package is a thin binding on top of this — you only need it directly for headless/custom-rendering use cases.

## `createPlacesAutocomplete(config)`

```ts
function createPlacesAutocomplete(config: PlacesAutocompleteConfig): PlacesAutocompleteController
```

Creates one autocomplete session controller. Config can be changed later on the live controller via [`setConfig()`](#placesautocompletecontroller) — every wrapper uses that to make its props/attributes live.

## `PlacesAutocompleteConfig`

| Field                  | Type                                            | Default                        |
| ------------------------ | ------------------------------------------------- | --------------------------------- |
| `apiKey`                  | `string?`                                          | required unless `fetcher` handles auth itself |
| `fetcher`                  | `Fetcher?`                                         | `globalThis.fetch`                |
| `debounceMs`               | `number?`                                          | `200`                             |
| `minLength`                | `number?`                                          | `1`                                |
| `languageCode`             | `string?`                                          |                                    |
| `regionCode`               | `string?`                                          |                                    |
| `includedRegionCodes`      | `string[]?`                                        |                                    |
| `includedPrimaryTypes`     | `string[]?`                                        | restrict to up to 5 place types (e.g. `['locality']` for a city picker) |
| `locationBias`             | `LocationBias?`                                    | soft ranking preference            |
| `locationRestriction`      | `LocationRestriction?`                             | hard filter (same shapes as `LocationBias`) |
| `origin`                   | `LatLng?`                                          | when set, each suggestion carries `distanceMeters` from this point |
| `resolveDetails`           | `boolean?`                                         | `true`                             |
| `placeFields`              | `readonly string[]?`                               | `DEFAULT_PLACE_FIELDS`             |
| `onSelect`                 | `(place: PlaceDetails, suggestion: Suggestion) => void` |                          |
| `onError`                  | `(error: PlacesAutocompleteError) => void`         |                                    |

## `PlacesAutocompleteController`

| Method                              | Description                                                        |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `getState()`                            | Returns the current [`PlacesAutocompleteState`](#placesautocompletestate). |
| `subscribe(listener)`                   | Registers a no-arg change listener; returns an unsubscribe function.   |
| `setQuery(query)`                       | Updates the query and (debounced) triggers a new search.               |
| `moveActive(delta)`                     | Moves the highlighted suggestion by `delta` (clamped to bounds).       |
| `setActiveIndex(index)`                 | Sets the highlighted suggestion directly.                             |
| `selectActive()`                        | Selects whichever suggestion is currently highlighted.                |
| `selectSuggestion(suggestion)`          | Selects a specific suggestion directly.                               |
| `close()`                               | Closes the suggestion list without changing the query.                |
| `setConfig(patch)`                      | Merges new config into the live controller (key, region, debounce, …). Aborts any in-flight request; the next keystroke searches with the new settings. |
| `clear()`                               | Resets to the initial state: empty query, no suggestions, no selection, fresh session token. |
| `destroy()`                             | Aborts any in-flight request, cancels the pending debounce, and clears listeners. Call this on unmount. |

## `PlacesAutocompleteState`

```ts
interface PlacesAutocompleteState {
  query: string
  suggestions: Suggestion[]
  activeIndex: number
  status: 'idle' | 'loading' | 'ready' | 'error'
  isOpen: boolean
  error: PlacesAutocompleteError | null
  selected: PlaceDetails | null
}
```

## `Suggestion`

```ts
interface Suggestion {
  placeId: string
  text: string // full display text
  mainText: string // structured primary text
  secondaryText: string // structured secondary text (may be empty)
  types: string[]
  textMatches: SuggestionMatch[] // matched ranges within `text`
  mainTextMatches: SuggestionMatch[] // matched ranges within `mainText`
  distanceMeters?: number // present when `origin` was configured
  raw: unknown // the untouched placePrediction from Google
}

interface SuggestionMatch {
  startOffset: number
  endOffset: number
}
```

Use the match ranges to bold the typed part of each suggestion the way Google's own widget does — e.g. wrap `mainText.slice(startOffset, endOffset)` in `<strong>` inside a custom suggestion renderer.

## `PlaceDetails`

```ts
interface PlaceDetails {
  placeId: string
  displayName: string
  formattedAddress: string
  location: { lat: number; lng: number } | null
  addressComponents: AddressComponent[]
  raw: unknown // the untouched Place Details response from Google
}

interface AddressComponent {
  longText: string
  shortText: string
  types: string[]
}
```

Every field you request via `placeFields` is available on `raw`, including ones the typed shape doesn't map (`types`, `googleMapsUri`, `viewport`, …).

## `LocationBias`

Mirrors Google's wire format (`latitude`/`longitude`) since it's passed through to the API unchanged:

```ts
type LocationBias =
  | { circle: { center: { latitude: number; longitude: number }; radius: number } }
  | { rectangle: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } } }
```

## `PlacesAutocompleteLabels`

```ts
interface PlacesAutocompleteLabels {
  searching: string // panel text while a request is in flight
  noResults: string // panel text when nothing matched
  placeholder: string // default input placeholder
}
```

Every wrapper accepts a `labels` prop (the element takes `searching-text` / `no-results-text` attributes) merged over the exported `DEFAULT_LABELS` — override for i18n or white-labeling.

## `Fetcher`

```ts
type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>
```

Same shape as `fetch` itself — override it to proxy through your own backend. See [Session tokens & billing](/guide/session-tokens#proxying-through-your-own-backend).

## `PlacesAutocompleteError`

Extends `Error` with an optional `status: number` (the HTTP status code, when the failure was a non-OK API response).

## Lower-level exports

`fetchAutocompleteSuggestions` and `fetchPlaceDetails` (the raw REST calls `createPlacesAutocomplete` uses internally), plus `createSessionToken`/`SessionTokenManager`, are also exported if you're building something more custom than a wrapper component.
