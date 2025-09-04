import { onScopeDispose, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import { createPlacesAutocomplete } from '@anil-labs/google-places-autocomplete-core'
import type {
  PlacesAutocompleteConfig,
  PlacesAutocompleteController,
  PlacesAutocompleteState,
} from '@anil-labs/google-places-autocomplete-core'

export interface UsePlacesAutocompleteReturn {
  state: ShallowRef<PlacesAutocompleteState>
  controller: PlacesAutocompleteController
}

/**
 * Binds `core`'s subscribe/getState machine to a Vue `shallowRef`. The
 * machine already hands out a brand-new state object on every change (see
 * `machine.ts`'s `setState`), so a shallow ref — reassign `.value`, no deep
 * proxying — is exactly the right amount of reactivity, and cheaper than
 * `reactive()` for state that includes an `Error` instance.
 */
export function usePlacesAutocomplete(
  config: PlacesAutocompleteConfig,
): UsePlacesAutocompleteReturn {
  const controller = createPlacesAutocomplete(config)
  const state = shallowRef(controller.getState())

  const unsubscribe = controller.subscribe(() => {
    state.value = controller.getState()
  })

  onScopeDispose(() => {
    unsubscribe()
    controller.destroy()
  })

  return { state, controller }
}
