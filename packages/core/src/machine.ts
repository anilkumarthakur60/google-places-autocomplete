import { fetchAutocompleteSuggestions, fetchPlaceDetails } from './api'
import { debounce } from './debounce'
import { SessionTokenManager } from './session'
import { DEFAULT_PLACE_FIELDS, PlacesAutocompleteError } from './types'
import type {
  Fetcher,
  PlacesAutocompleteConfig,
  PlacesAutocompleteController,
  PlacesAutocompleteState,
  PlaceDetails,
  Suggestion,
} from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function requireApiKey(apiKey: string | undefined): string {
  if (!apiKey) {
    throw new PlacesAutocompleteError(
      'config.apiKey is required unless config.fetcher fully handles authentication itself (e.g. a backend proxy).',
    )
  }
  return apiKey
}

const INITIAL_STATE: PlacesAutocompleteState = {
  query: '',
  suggestions: [],
  activeIndex: -1,
  status: 'idle',
  isOpen: false,
  error: null,
  selected: null,
}

export function createPlacesAutocomplete(
  config: PlacesAutocompleteConfig,
): PlacesAutocompleteController {
  const {
    apiKey,
    fetcher = typeof fetch === 'function' ? fetch.bind(globalThis) : undefined,
    debounceMs = 200,
    minLength = 1,
    resolveDetails = true,
    placeFields = DEFAULT_PLACE_FIELDS,
    languageCode,
    regionCode,
    includedRegionCodes,
    locationBias,
    onSelect,
    onError,
  } = config

  if (!fetcher) {
    throw new PlacesAutocompleteError(
      'No fetch implementation is available in this environment; pass config.fetcher explicitly.',
    )
  }
  // A fresh binding with a non-optional type: TS narrowing from the guard
  // above does not persist into the nested `search`/`resolveSelection`
  // closures below (they may run long after this constructor call), so
  // referencing the closured `fetcher` there would still type as optional.
  const activeFetcher: Fetcher = fetcher

  let state: PlacesAutocompleteState = INITIAL_STATE
  const listeners = new Set<() => void>()
  const session = new SessionTokenManager()
  let abortController: AbortController | null = null
  let requestId = 0
  let destroyed = false

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function setState(patch: Partial<PlacesAutocompleteState>): void {
    state = { ...state, ...patch }
    notify()
  }

  function abortInFlight(): void {
    abortController?.abort()
    abortController = null
  }

  async function search(query: string): Promise<void> {
    if (destroyed) return
    abortInFlight()

    if (query.trim().length < minLength) {
      setState({ suggestions: [], status: 'idle', isOpen: false, activeIndex: -1, error: null })
      return
    }

    const controller = new AbortController()
    abortController = controller
    const currentRequestId = ++requestId
    setState({ status: 'loading' })

    try {
      const suggestions = await fetchAutocompleteSuggestions({
        input: query,
        sessionToken: session.get(),
        apiKey: requireApiKey(apiKey),
        fetcher: activeFetcher,
        signal: controller.signal,
        ...(languageCode ? { languageCode } : {}),
        ...(regionCode ? { regionCode } : {}),
        ...(includedRegionCodes ? { includedRegionCodes } : {}),
        ...(locationBias ? { locationBias } : {}),
      })
      // A newer request may have started (and its abort may not have settled
      // this promise) while this one was in flight — the id check is the
      // real guard, `signal.aborted` alone would race it.
      if (destroyed || currentRequestId !== requestId) return
      setState({
        suggestions,
        status: 'ready',
        isOpen: suggestions.length > 0,
        activeIndex: suggestions.length > 0 ? 0 : -1,
        error: null,
      })
    } catch (error) {
      if (isAbortError(error)) return
      if (destroyed || currentRequestId !== requestId) return
      const wrapped =
        error instanceof PlacesAutocompleteError
          ? error
          : new PlacesAutocompleteError('Failed to fetch place suggestions', { cause: error })
      setState({ status: 'error', error: wrapped, suggestions: [], isOpen: false })
      onError?.(wrapped)
    }
  }

  const debouncedSearch = debounce((query: string) => {
    void search(query)
  }, debounceMs)

  async function resolveSelection(suggestion: Suggestion): Promise<void> {
    if (!resolveDetails) {
      const minimal: PlaceDetails = {
        placeId: suggestion.placeId,
        displayName: suggestion.mainText,
        formattedAddress: suggestion.text,
        location: null,
        addressComponents: [],
      }
      session.reset()
      setState({ selected: minimal, isOpen: false, suggestions: [], query: suggestion.text })
      onSelect?.(minimal, suggestion)
      return
    }

    setState({ status: 'loading' })
    try {
      const details = await fetchPlaceDetails({
        placeId: suggestion.placeId,
        sessionToken: session.get(),
        apiKey: requireApiKey(apiKey),
        fetcher: activeFetcher,
        fields: placeFields,
      })
      if (destroyed) return
      setState({
        selected: details,
        isOpen: false,
        suggestions: [],
        query: details.formattedAddress || suggestion.text,
        status: 'ready',
      })
      onSelect?.(details, suggestion)
    } catch (error) {
      if (destroyed) return
      const wrapped =
        error instanceof PlacesAutocompleteError
          ? error
          : new PlacesAutocompleteError('Failed to fetch place details', { cause: error })
      setState({ status: 'error', error: wrapped })
      onError?.(wrapped)
    } finally {
      // One session covers autocomplete + the details lookup that resolved
      // it; the next search must start a fresh one.
      session.reset()
    }
  }

  return {
    getState: () => state,

    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    setQuery(query: string) {
      const stillMatchesSelection = state.selected !== null && query === state.query
      setState({ query, selected: stillMatchesSelection ? state.selected : null })
      debouncedSearch.run(query)
    },

    moveActive(delta: number) {
      if (state.suggestions.length === 0) return
      setState({ activeIndex: clamp(state.activeIndex + delta, 0, state.suggestions.length - 1) })
    },

    setActiveIndex(index: number) {
      setState({ activeIndex: index })
    },

    selectActive() {
      const suggestion = state.suggestions[state.activeIndex]
      if (suggestion) void resolveSelection(suggestion)
    },

    selectSuggestion(suggestion: Suggestion) {
      void resolveSelection(suggestion)
    },

    close() {
      setState({ isOpen: false })
    },

    destroy() {
      destroyed = true
      abortInFlight()
      debouncedSearch.cancel()
      listeners.clear()
    },
  }
}
