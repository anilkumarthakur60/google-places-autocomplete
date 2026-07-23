/**
 * A matched range inside a suggestion's text — the part that corresponds to
 * what the user typed. Offsets index into the string they annotate; use them
 * to bold the match the way Google's own widget does.
 */
export interface SuggestionMatch {
  startOffset: number
  endOffset: number
}

/** A single row returned by the Places Autocomplete (New) endpoint. */
export interface Suggestion {
  placeId: string
  /** Full display text, e.g. "1600 Amphitheatre Parkway, Mountain View, CA, USA". */
  text: string
  /** Structured primary text, e.g. "1600 Amphitheatre Parkway". Falls back to `text`. */
  mainText: string
  /** Structured secondary text, e.g. "Mountain View, CA, USA". Empty if Google omits it. */
  secondaryText: string
  types: string[]
  /** Matched ranges within {@link text}. */
  textMatches: SuggestionMatch[]
  /** Matched ranges within {@link mainText} — what dropdown highlighting wants. */
  mainTextMatches: SuggestionMatch[]
  /** Straight-line distance from {@link PlacesAutocompleteConfig.origin}, when one was set. */
  distanceMeters?: number
  /**
   * The raw `placePrediction` object from Google, untouched. Anything this
   * library doesn't map — new API fields, experimental data — is still here.
   */
  raw: unknown
}

export interface AddressComponent {
  longText: string
  shortText: string
  types: string[]
}

/** A resolved place, fetched via Place Details (New) after the user picks a suggestion. */
export interface PlaceDetails {
  placeId: string
  displayName: string
  formattedAddress: string
  location: { lat: number; lng: number } | null
  addressComponents: AddressComponent[]
  /**
   * The raw Place Details response from Google, untouched. Every field you
   * request via {@link PlacesAutocompleteConfig.placeFields} is available
   * here, including ones this library doesn't map into the typed shape
   * (`types`, `googleMapsUri`, `viewport`, …).
   */
  raw: unknown
}

export interface LocationBiasCircle {
  circle: {
    center: { latitude: number; longitude: number }
    radius: number
  }
}

export interface LocationBiasRectangle {
  rectangle: {
    low: { latitude: number; longitude: number }
    high: { latitude: number; longitude: number }
  }
}

/** Mirrors Google's wire format (latitude/longitude) since it is passed straight through. */
export type LocationBias = LocationBiasCircle | LocationBiasRectangle

/** Same shapes as {@link LocationBias}, but a hard filter instead of a preference. */
export type LocationRestriction = LocationBias

/** A point in Google's wire format, e.g. the user's position for distance ranking. */
export interface LatLng {
  latitude: number
  longitude: number
}

/** Same shape as `fetch` itself — the default is `globalThis.fetch`. */
export type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>

export const DEFAULT_PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'addressComponents',
] as const

/** User-facing strings rendered by the wrappers — override for i18n/white-labeling. */
export interface PlacesAutocompleteLabels {
  /** Shown in the panel while a request is in flight. */
  searching: string
  /** Shown in the panel when a query returns no suggestions. */
  noResults: string
  /** Default input placeholder (wrappers may also take an explicit placeholder prop). */
  placeholder: string
}

export const DEFAULT_LABELS: PlacesAutocompleteLabels = {
  searching: 'Searching…',
  noResults: 'No results found',
  placeholder: 'Search for an address…',
}

export interface PlacesAutocompleteConfig {
  /**
   * Required unless `fetcher` fully handles authentication itself (e.g. a
   * backend proxy that attaches its own server-side key). Never bundle a
   * real key into published code — pass it in at runtime.
   */
  apiKey?: string
  /** Override to proxy requests through your own backend instead of calling Google directly. */
  fetcher?: Fetcher
  /** Debounce between the last keystroke and the autocomplete request. Default 200ms. */
  debounceMs?: number
  /** Minimum query length before a request fires. Default 1. */
  minLength?: number
  /** Localizes suggestion text — and, when `resolveDetails` is on, the resolved details too. */
  languageCode?: string
  regionCode?: string
  includedRegionCodes?: string[]
  /**
   * Restrict predictions to up to five place types, e.g. `['locality']` for a
   * city picker or `['street_address', 'premise']` for shipping addresses.
   */
  includedPrimaryTypes?: string[]
  /** Prefer results near an area (soft ranking hint). */
  locationBias?: LocationBias
  /** Only return results inside an area (hard filter). */
  locationRestriction?: LocationRestriction
  /**
   * When set, each {@link Suggestion} carries `distanceMeters` from this
   * point — e.g. for "0.4 km away" rows sorted by proximity.
   */
  origin?: LatLng
  /** Auto-fetch Place Details (New) after selection, reusing the same session token. Default true. */
  resolveDetails?: boolean
  /** Field mask for the Place Details request. Default {@link DEFAULT_PLACE_FIELDS}. */
  placeFields?: readonly string[]
  onSelect?: (place: PlaceDetails, suggestion: Suggestion) => void
  onError?: (error: PlacesAutocompleteError) => void
}

export type PlacesAutocompleteStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface PlacesAutocompleteState {
  query: string
  suggestions: Suggestion[]
  activeIndex: number
  status: PlacesAutocompleteStatus
  isOpen: boolean
  error: PlacesAutocompleteError | null
  selected: PlaceDetails | null
}

// Every method is `this: void`: none of them close over `this` (the
// implementation is a plain object of closures, not a class), and declaring
// that explicitly lets consumers tear off e.g. `controller.subscribe` as a
// bare callback (React's `useSyncExternalStore(controller.subscribe, ...)`)
// without `@typescript-eslint/unbound-method` flagging a lost-`this` risk
// that cannot actually occur.
export interface PlacesAutocompleteController {
  getState(this: void): PlacesAutocompleteState
  /** Returns an unsubscribe function. */
  subscribe(this: void, listener: () => void): () => void
  setQuery(this: void, query: string): void
  moveActive(this: void, delta: number): void
  setActiveIndex(this: void, index: number): void
  selectActive(this: void): void
  selectSuggestion(this: void, suggestion: Suggestion): void
  close(this: void): void
  /**
   * Merge new config into the live controller — change the API key, region,
   * debounce, anything — without recreating it. Aborts any in-flight request
   * (its results would belong to the old config) but keeps the current query
   * and selection; the next keystroke searches with the new settings.
   */
  setConfig(this: void, patch: Partial<PlacesAutocompleteConfig>): void
  /** Reset to the initial state: empty query, no suggestions, no selection, fresh session. */
  clear(this: void): void
  destroy(this: void): void
}

export class PlacesAutocompleteError extends Error {
  readonly status?: number

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'PlacesAutocompleteError'
    this.status = options?.status
  }
}
