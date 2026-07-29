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
  // Mutable so setConfig() can merge changes into a LIVE controller — the
  // wrappers no longer need to destroy/recreate to change the API key,
  // region, debounce, etc. Every request reads from here at call time.
  let cfg: PlacesAutocompleteConfig = { ...config }

  const defaultFetcher: Fetcher | undefined =
    typeof fetch === 'function' ? fetch.bind(globalThis) : undefined

  if (!cfg.fetcher && !defaultFetcher) {
    throw new PlacesAutocompleteError(
      'No fetch implementation is available in this environment; pass config.fetcher explicitly.',
    )
  }

  function resolveFetcher(): Fetcher {
    const fetcher = cfg.fetcher ?? defaultFetcher
    if (!fetcher) {
      // Reachable only if setConfig() removed the fetcher in a fetch-less
      // environment; surfaces as an error state via search()'s catch.
      throw new PlacesAutocompleteError(
        'No fetch implementation is available in this environment; pass config.fetcher explicitly.',
      )
    }
    return fetcher
  }

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

    if (query.trim().length < (cfg.minLength ?? 1)) {
      setState({ suggestions: [], status: 'idle', isOpen: false, activeIndex: -1, error: null })
      return
    }

    const controller = new AbortController()
    abortController = controller
    const currentRequestId = ++requestId
    // isOpen flips true here (not just once suggestions exist), so a wrapper
    // can render a loading indicator immediately, then either the results or
    // a "no results" message once the request settles — the panel appearing
    // and disappearing based on the query alone, independent of whether it
    // ends up empty.
    setState({ status: 'loading', isOpen: true })

    try {
      const suggestions = await fetchAutocompleteSuggestions({
        input: query,
        sessionToken: session.get(),
        apiKey: requireApiKey(cfg.apiKey),
        fetcher: resolveFetcher(),
        signal: controller.signal,
        ...(cfg.languageCode ? { languageCode: cfg.languageCode } : {}),
        ...(cfg.regionCode ? { regionCode: cfg.regionCode } : {}),
        ...(cfg.includedRegionCodes ? { includedRegionCodes: cfg.includedRegionCodes } : {}),
        ...(cfg.includedPrimaryTypes ? { includedPrimaryTypes: cfg.includedPrimaryTypes } : {}),
        ...(cfg.locationBias ? { locationBias: cfg.locationBias } : {}),
        ...(cfg.locationRestriction ? { locationRestriction: cfg.locationRestriction } : {}),
        ...(cfg.origin ? { origin: cfg.origin } : {}),
      })
      // A newer request may have started (and its abort may not have settled
      // this promise) while this one was in flight — the id check is the
      // real guard, `signal.aborted` alone would race it.
      if (destroyed || currentRequestId !== requestId) return
      setState({
        suggestions,
        status: 'ready',
        isOpen: true,
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
      cfg.onError?.(wrapped)
    }
  }

  function makeDebouncedSearch() {
    return debounce((query: string) => {
      void search(query)
    }, cfg.debounceMs ?? 200)
  }

  let debouncedSearch = makeDebouncedSearch()

  async function resolveSelection(suggestion: Suggestion): Promise<void> {
    // Selecting a suggestion is terminal from the panel's perspective — close
    // it immediately rather than lingering open (mid old-suggestions) for
    // the duration of the details fetch below.
    setState({ isOpen: false })

    if (!(cfg.resolveDetails ?? true)) {
      const minimal: PlaceDetails = {
        placeId: suggestion.placeId,
        displayName: suggestion.mainText,
        formattedAddress: suggestion.text,
        location: null,
        addressComponents: [],
        raw: suggestion.raw,
      }
      session.reset()
      setState({ selected: minimal, suggestions: [], query: suggestion.text })
      cfg.onSelect?.(minimal, suggestion)
      return
    }

    // Abortable like the autocomplete request, so destroy()/clear() mid-fetch
    // actually cancels the network call rather than just ignoring its result.
    abortInFlight()
    const controller = new AbortController()
    abortController = controller

    setState({ status: 'loading' })
    try {
      const details = await fetchPlaceDetails({
        placeId: suggestion.placeId,
        sessionToken: session.get(),
        apiKey: requireApiKey(cfg.apiKey),
        fetcher: resolveFetcher(),
        fields: cfg.placeFields ?? DEFAULT_PLACE_FIELDS,
        signal: controller.signal,
        // Details come back in the same locale the suggestions were shown in.
        ...(cfg.languageCode ? { languageCode: cfg.languageCode } : {}),
        ...(cfg.regionCode ? { regionCode: cfg.regionCode } : {}),
      })
      if (destroyed) return
      setState({
        selected: details,
        isOpen: false,
        suggestions: [],
        query: details.formattedAddress || suggestion.text,
        status: 'ready',
      })
      cfg.onSelect?.(details, suggestion)
    } catch (error) {
      if (destroyed || isAbortError(error)) return
      const wrapped =
        error instanceof PlacesAutocompleteError
          ? error
          : new PlacesAutocompleteError('Failed to fetch place details', { cause: error })
      setState({ status: 'error', error: wrapped })
      cfg.onError?.(wrapped)
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

    setConfig(patch: Partial<PlacesAutocompleteConfig>) {
      const debounceChanged =
        patch.debounceMs !== undefined && patch.debounceMs !== (cfg.debounceMs ?? 200)
      cfg = { ...cfg, ...patch }
      // In-flight results would belong to the old config (old key, old
      // region…) — drop them. requestId also invalidates any request whose
      // abort hasn't settled yet.
      abortInFlight()
      requestId++
      if (debounceChanged) {
        debouncedSearch.cancel()
        debouncedSearch = makeDebouncedSearch()
      }
    },

    clear() {
      abortInFlight()
      requestId++
      debouncedSearch.cancel()
      session.reset()
      setState({ ...INITIAL_STATE })
    },

    destroy() {
      destroyed = true
      abortInFlight()
      debouncedSearch.cancel()
      listeners.clear()
    },
  }
}
