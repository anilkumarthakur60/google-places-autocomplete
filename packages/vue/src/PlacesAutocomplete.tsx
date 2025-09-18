import { defineComponent, useId, watch } from 'vue'
import type { PropType } from 'vue'
import { usePlacesAutocomplete } from './usePlacesAutocomplete'
import type {
  Fetcher,
  LocationBias,
  PlaceDetails,
  PlacesAutocompleteError,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

export const PlacesAutocomplete = defineComponent({
  name: 'PlacesAutocomplete',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Search for an address…' },
    apiKey: { type: String, default: undefined },
    fetcher: { type: Function as PropType<Fetcher>, default: undefined },
    debounceMs: { type: Number, default: undefined },
    minLength: { type: Number, default: undefined },
    languageCode: { type: String, default: undefined },
    regionCode: { type: String, default: undefined },
    includedRegionCodes: { type: Array as PropType<string[]>, default: undefined },
    locationBias: { type: Object as PropType<LocationBias>, default: undefined },
    resolveDetails: { type: Boolean, default: undefined },
  },
  emits: {
    'update:modelValue': (_value: string) => true,
    select: (_place: PlaceDetails, _suggestion: Suggestion) => true,
    error: (_error: PlacesAutocompleteError) => true,
  },
  setup(props, { emit }) {
    const uid = useId()
    const { state, controller } = usePlacesAutocomplete({
      apiKey: props.apiKey,
      fetcher: props.fetcher,
      debounceMs: props.debounceMs,
      minLength: props.minLength,
      languageCode: props.languageCode,
      regionCode: props.regionCode,
      includedRegionCodes: props.includedRegionCodes,
      locationBias: props.locationBias,
      resolveDetails: props.resolveDetails,
      onSelect: (place, suggestion) => emit('select', place, suggestion),
      onError: (error) => emit('error', error),
    })

    if (props.modelValue) controller.setQuery(props.modelValue)

    // Lets a parent reset the field (e.g. on form submit) by writing to the
    // v-model value; feedback loops are avoided by only reacting when the
    // incoming value differs from what the machine already has.
    watch(
      () => props.modelValue,
      (next) => {
        if (next !== state.value.query) controller.setQuery(next)
      },
    )

    function handleInput(event: Event): void {
      const value = (event.target as HTMLInputElement).value
      emit('update:modelValue', value)
      controller.setQuery(value)
    }

    function handleKeydown(event: KeyboardEvent): void {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          controller.moveActive(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          controller.moveActive(-1)
          break
        case 'Enter':
          if (state.value.isOpen) {
            event.preventDefault()
            controller.selectActive()
          }
          break
        case 'Escape':
          controller.close()
          break
      }
    }

    return () => {
      const current = state.value
      return (
        <div class="gpa-root">
          <input
            class="gpa-input"
            type="text"
            role="combobox"
            aria-expanded={current.isOpen}
            aria-autocomplete="list"
            aria-controls={`${uid}-listbox`}
            aria-activedescendant={
              current.isOpen && current.activeIndex >= 0
                ? `${uid}-option-${current.activeIndex}`
                : undefined
            }
            autocomplete="off"
            placeholder={props.placeholder}
            value={current.query}
            onInput={handleInput}
            onKeydown={handleKeydown}
          />
          {current.isOpen && current.suggestions.length > 0 && (
            <ul class="gpa-listbox" role="listbox" id={`${uid}-listbox`}>
              {current.suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.placeId}
                  id={`${uid}-option-${index}`}
                  class="gpa-option"
                  role="option"
                  aria-selected={index === current.activeIndex}
                  data-active={index === current.activeIndex}
                  onMousedown={(event: MouseEvent) => {
                    event.preventDefault()
                    controller.selectSuggestion(suggestion)
                  }}
                >
                  <div class="gpa-option-main">{suggestion.mainText}</div>
                  {suggestion.secondaryText && (
                    <div class="gpa-option-secondary">{suggestion.secondaryText}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }
  },
})
