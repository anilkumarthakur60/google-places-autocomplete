# Core (`@anil-labs/google-places-autocomplete-core`)

Framework-agnostic engine. Every wrapper package is a thin binding on top of this — you only need it directly for headless/custom-rendering use cases.

## `createPlacesAutocomplete(config)`

```ts
function createPlacesAutocomplete(config: PlacesAutocompleteConfig): PlacesAutocompleteController
```

Creates one autocomplete session controller. Config is read once, at creation — see each framework guide for how "change it" maps to "recreate the controller" in that framework.

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
| `locationBias`             | `LocationBias?`                                    |                                    |
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
}
```

## `PlaceDetails`

```ts
interface PlaceDetails {
  placeId: string
  displayName: string
  formattedAddress: string
  location: { lat: number; lng: number } | null
  addressComponents: AddressComponent[]
}

interface AddressComponent {
  longText: string
  shortText: string
  types: string[]
}
```

## `LocationBias`

Mirrors Google's wire format (`latitude`/`longitude`) since it's passed through to the API unchanged:

```ts
type LocationBias =
  | { circle: { center: { latitude: number; longitude: number }; radius: number } }
  | { rectangle: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } } }
```

## `Fetcher`

```ts
type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>
```

Same shape as `fetch` itself — override it to proxy through your own backend. See [Session tokens & billing](/guide/session-tokens#proxying-through-your-own-backend).

## `PlacesAutocompleteError`

Extends `Error` with an optional `status: number` (the HTTP status code, when the failure was a non-OK API response).

## Lower-level exports

`fetchAutocompleteSuggestions` and `fetchPlaceDetails` (the raw REST calls `createPlacesAutocomplete` uses internally), plus `createSessionToken`/`SessionTokenManager`, are also exported if you're building something more custom than a wrapper component.
