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

/** Same shape as `fetch` itself — the default is `globalThis.fetch`. */
export type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>

export const DEFAULT_PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'addressComponents',
] as const

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
  languageCode?: string
  regionCode?: string
  includedRegionCodes?: string[]
  locationBias?: LocationBias
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
