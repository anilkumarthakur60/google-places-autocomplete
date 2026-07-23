<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import type { Snippet } from 'svelte'
  import {
    bindOutsideClose,
    createPlacesAutocomplete,
    DEFAULT_LABELS,
  } from '@anil-labs/google-places-autocomplete-core'
  import type {
    PlacesAutocompleteConfig,
    PlacesAutocompleteLabels,
    PlaceDetails,
    PlacesAutocompleteError,
    Suggestion,
  } from '@anil-labs/google-places-autocomplete-core'

  interface Props extends Omit<PlacesAutocompleteConfig, 'onSelect' | 'onError'> {
    value?: string
    placeholder?: string
    onSelect?: (place: PlaceDetails, suggestion: Suggestion) => void
    onError?: (error: PlacesAutocompleteError) => void
    /** Override the built-in strings (searching / no-results) for i18n. */
    labels?: Partial<PlacesAutocompleteLabels>
    /**
     * Replace the default two-line option rendering. The component keeps
     * ownership of the <li>, its ARIA wiring and selection handling.
     */
    suggestion?: Snippet<[{ suggestion: Suggestion; active: boolean }]>
  }

  let {
    value = $bindable(''),
    placeholder,
    onSelect,
    onError,
    labels,
    suggestion: suggestionSnippet,
    ...config
  }: Props = $props()

  const uid = $props.id()
  let rootEl: HTMLDivElement | undefined = $state(undefined)

  // svelte-ignore state_referenced_locally -- intentional: the controller is
  // constructed once from the initial config; live prop changes are pushed
  // into it via the $effect below rather than by recreating it.
  const controller = createPlacesAutocomplete({
    ...config,
    onSelect: (place, s) => onSelect?.(place, s),
    onError: (error) => onError?.(error),
  })

  // Live config: prop changes flow into the machine via setConfig() —
  // no remount needed. The effect also runs once on mount with the values
  // the controller was constructed from; that call is a harmless no-op
  // (nothing is in flight yet, and the merged config is identical).
  $effect(() => {
    const patch = { ...config }
    untrack(() => controller.setConfig(patch))
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
    placeholder={placeholder ?? labels?.placeholder ?? DEFAULT_LABELS.placeholder}
    value={machineState.query}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  {#if machineState.isOpen}
    <div class="gpa-panel" id="{uid}-panel">
      {#if machineState.status === 'loading'}
        <div class="gpa-status" role="status">{labels?.searching ?? DEFAULT_LABELS.searching}</div>
      {:else if machineState.suggestions.length === 0}
        <div class="gpa-empty" role="status">{labels?.noResults ?? DEFAULT_LABELS.noResults}</div>
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
              {#if suggestionSnippet}
                {@render suggestionSnippet({
                  suggestion,
                  active: index === machineState.activeIndex,
                })}
              {:else}
                <div class="gpa-option-main">{suggestion.mainText}</div>
                {#if suggestion.secondaryText}
                  <div class="gpa-option-secondary">{suggestion.secondaryText}</div>
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
