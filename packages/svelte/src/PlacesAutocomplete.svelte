<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    bindOutsideClose,
    createPlacesAutocomplete,
  } from '@anil-labs/google-places-autocomplete-core'
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
  let rootEl: HTMLDivElement | undefined = $state(undefined)

  // svelte-ignore state_referenced_locally -- intentional: config
  // (apiKey/debounceMs/etc.) is captured once at construction, matching the
  // Vue/React wrappers' documented behavior. Reconfigure by remounting
  // (e.g. a `#key`-equivalent block) rather than expecting live updates.
  const controller = createPlacesAutocomplete({
    ...config,
    onSelect: (place, suggestion) => onSelect?.(place, suggestion),
    onError: (error) => onError?.(error),
  })

  let machineState = $state(controller.getState())

  const unsubscribe = controller.subscribe(() => {
    machineState = controller.getState()
  })

  onDestroy(() => {
    unsubscribe()
    controller.destroy()
  })

  $effect(() => {
    if (!rootEl) return
    return bindOutsideClose(rootEl, () => controller.close())
  })

  // Lets a parent reset the field (e.g. on form submit) by writing to the
  // bound value. The machine updates `machineState.query` synchronously inside
  // setQuery, so by the time this effect re-runs the two are already equal
  // and it no-ops — no feedback loop with handleInput below.
  $effect(() => {
    if (value !== machineState.query) controller.setQuery(value ?? '')
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
        if (machineState.isOpen) {
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

<div class="gpa-root" bind:this={rootEl}>
  <input
    class="gpa-input"
    type="text"
    role="combobox"
    aria-expanded={machineState.isOpen}
    aria-autocomplete="list"
    aria-controls="{uid}-panel"
    aria-activedescendant={machineState.isOpen && machineState.activeIndex >= 0
      ? `${uid}-option-${machineState.activeIndex}`
      : undefined}
    autocomplete="off"
    {placeholder}
    value={machineState.query}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  {#if machineState.isOpen}
    <div class="gpa-panel" id="{uid}-panel">
      {#if machineState.status === 'loading'}
        <div class="gpa-status" role="status">Searching…</div>
      {:else if machineState.suggestions.length === 0}
        <div class="gpa-empty" role="status">No results found</div>
      {:else}
        <ul class="gpa-listbox" role="listbox">
          {#each machineState.suggestions as suggestion, index (suggestion.placeId)}
            <li
              id="{uid}-option-{index}"
              class="gpa-option"
              role="option"
              aria-selected={index === machineState.activeIndex}
              data-active={index === machineState.activeIndex}
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
  {/if}
</div>
