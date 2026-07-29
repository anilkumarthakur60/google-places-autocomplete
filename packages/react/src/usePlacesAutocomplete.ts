import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPlacesAutocomplete } from '@anil-labs/google-places-autocomplete-core'
import type {
  PlacesAutocompleteConfig,
  PlacesAutocompleteController,
  PlacesAutocompleteState,
} from '@anil-labs/google-places-autocomplete-core'

export interface UsePlacesAutocompleteReturn {
  state: PlacesAutocompleteState
  controller: PlacesAutocompleteController
}

/**
 * Binds `core`'s subscribe/getState machine into React via
 * `useSyncExternalStore` — the machine is the single source of truth, React
 * never mirrors it into its own state.
 *
 * The controller is constructed once (lazy `useState` initializer) and lives
 * for the component's lifetime. Config is LIVE: when `apiKey`, `regionCode`,
 * `debounceMs`, … change between renders, they're pushed into the machine via
 * `controller.setConfig()` — no remount needed. (`fetcher` is the one
 * exception: pass a stable function; a fresh inline fetcher every render
 * would otherwise abort in-flight requests on each keystroke.)
 * `onSelect`/`onError` are re-read from a ref on every render, so they never
 * go stale — the common footgun this avoids is a parent passing a fresh
 * inline callback every render and the machine silently keeping the first
 * one forever.
 */
export function usePlacesAutocomplete(
  config: PlacesAutocompleteConfig,
): UsePlacesAutocompleteReturn {
  const onSelectRef = useRef(config.onSelect)
  const onErrorRef = useRef(config.onError)

  // Refs must not be written during render (React flags this — a render can
  // be discarded or re-run without committing); syncing them in a layout
  // effect keeps them current before the user can interact, without
  // violating that rule.
  useLayoutEffect(() => {
    onSelectRef.current = config.onSelect
    onErrorRef.current = config.onError
  })

  /*
   * The two trampolines below only read .current from inside an async
   * callback the core machine invokes later (search()/resolveSelection() in
   * machine.ts), never synchronously while createPlacesAutocomplete
   * constructs the controller. The lint rule can't see across that
   * boundary, so it conservatively flags any ref read reachable from a
   * function built during render.
   */
  // eslint-disable-next-line react-hooks/refs -- see comment above; verified safe
  const [controller] = useState<PlacesAutocompleteController>(() =>
    createPlacesAutocomplete({
      ...config,
      onSelect: (place, suggestion) => onSelectRef.current?.(place, suggestion),
      onError: (error) => onErrorRef.current?.(error),
    }),
  )

  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState)

  // Live config: push changes into the machine instead of requiring a
  // remount. Object-valued options are compared by content (they're plain
  // data), so parents may pass fresh literals every render without churn.
  // setConfig aborts in-flight requests, so it must only run on real change.
  const objectConfig = JSON.stringify([
    config.includedRegionCodes,
    config.includedPrimaryTypes,
    config.locationBias,
    config.locationRestriction,
    config.origin,
    config.placeFields,
  ])
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      // The controller was just constructed from exactly this config.
      firstRender.current = false
      return
    }
    controller.setConfig({
      apiKey: config.apiKey,
      debounceMs: config.debounceMs,
      minLength: config.minLength,
      languageCode: config.languageCode,
      regionCode: config.regionCode,
      includedRegionCodes: config.includedRegionCodes,
      includedPrimaryTypes: config.includedPrimaryTypes,
      locationBias: config.locationBias,
      locationRestriction: config.locationRestriction,
      origin: config.origin,
      resolveDetails: config.resolveDetails,
      placeFields: config.placeFields,
    })
    // Object-valued options are covered by the stringified `objectConfig`
    // dep; fetcher and the callbacks are intentionally excluded (docblock).
    // The bare directive below must stay adjacent to the dep-array line —
    // Prettier reflows longer trailing comments off their target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    controller,
    config.apiKey,
    config.debounceMs,
    config.minLength,
    config.languageCode,
    config.regionCode,
    config.resolveDetails,
    objectConfig,
  ])

  useEffect(() => () => controller.destroy(), [controller])

  return { state, controller }
}
