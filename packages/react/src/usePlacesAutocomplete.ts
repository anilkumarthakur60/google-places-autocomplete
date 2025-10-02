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
 * for the component's lifetime; `apiKey`/`debounceMs`/etc. are read only at
 * that first construction; remount the component (e.g. via a `key`) to apply
 * a changed one. `onSelect`/`onError`, however, are re-read from a ref on
 * every render, so they never go stale even though the controller itself
 * doesn't get rebuilt — the common footgun this avoids is a parent passing a
 * fresh inline callback every render and the machine silently keeping the
 * first one forever.
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

  useEffect(() => () => controller.destroy(), [controller])

  return { state, controller }
}
