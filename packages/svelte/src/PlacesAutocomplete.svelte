<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createPlacesAutocomplete } from '@anil-labs/google-places-autocomplete-core'
  import type {
    PlacesAutocompleteConfig,
    PlaceDetails,
    PlacesAutocompleteError,
    Suggestion,
  } from '@anil-labs/google-places-autocomplete-core'

  interface Props extends Omit<PlacesAutocompleteConfig, 'onSelect' | 'onError'> {
    value?: string
    placeholder?: string
    onSelect?: (place: PlaceDetails, suggestion: Suggestion) => void
    onError?: (error: PlacesAutocompleteError) => void
  }

  let {
    value = $bindable(''),
    placeholder = 'Search for an address…',
    onSelect,
    onError,
    ...config
  }: Props = $props()

  const uid = $props.id()

  // svelte-ignore state_referenced_locally -- intentional: config
  // (apiKey/debounceMs/etc.) is captured once at construction, matching the
  // Vue/React wrappers' documented behavior. Reconfigure by remounting
  // (e.g. a `#key`-equivalent block) rather than expecting live updates.
  const controller = createPlacesAutocomplete({
    ...config,
    onSelect: (place, suggestion) => onSelect?.(place, suggestion),
    onError: (error) => onError?.(error),
  })

  let state = $state(controller.getState())

  const unsubscribe = controller.subscribe(() => {
    state = controller.getState()
  })

  onDestroy(() => {
    unsubscribe()
    controller.destroy()
  })

  // Lets a parent reset the field (e.g. on form submit) by writing to the
  // bound value. The machine updates `state.query` synchronously inside
  // setQuery, so by the time this effect re-runs the two are already equal
  // and it no-ops — no feedback loop with handleInput below.
  $effect(() => {
    if (value !== state.query) controller.setQuery(value ?? '')
  })

  function handleInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value
    value = next
    controller.setQuery(next)
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
        if (state.isOpen) {
          event.preventDefault()
          controller.selectActive()
        }
        break
      case 'Escape':
        controller.close()
        break
    }
  }
</script>

<div class="gpa-root">
  <input
    class="gpa-input"
    type="text"
    role="combobox"
    aria-expanded={state.isOpen}
    aria-autocomplete="list"
    aria-controls="{uid}-listbox"
    aria-activedescendant={state.isOpen && state.activeIndex >= 0
      ? `${uid}-option-${state.activeIndex}`
      : undefined}
    autocomplete="off"
    {placeholder}
    value={state.query}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  {#if state.isOpen && state.suggestions.length > 0}
    <ul class="gpa-listbox" role="listbox" id="{uid}-listbox">
      {#each state.suggestions as suggestion, index (suggestion.placeId)}
        <li
          id="{uid}-option-{index}"
          class="gpa-option"
          role="option"
          aria-selected={index === state.activeIndex}
          data-active={index === state.activeIndex}
          onmousedown={(event) => {
            event.preventDefault()
            controller.selectSuggestion(suggestion)
          }}
        >
          <div class="gpa-option-main">{suggestion.mainText}</div>
          {#if suggestion.secondaryText}
            <div class="gpa-option-secondary">{suggestion.secondaryText}</div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
