import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  For,
  Show,
} from 'solid-js'
import type { Component, JSX } from 'solid-js'
import {
  bindOutsideClose,
  createPlacesAutocomplete,
  DEFAULT_LABELS,
} from '@anil-labs/google-places-autocomplete-core'
import type {
  PlaceDetails,
  PlacesAutocompleteConfig,
  PlacesAutocompleteError,
  PlacesAutocompleteLabels,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

export interface PlacesAutocompleteProps extends Omit<
  PlacesAutocompleteConfig,
  'onSelect' | 'onError'
> {
  value?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  onSelect?: (place: PlaceDetails, suggestion: Suggestion) => void
  onError?: (error: PlacesAutocompleteError) => void
  class?: string
  /** Override the built-in strings (searching / no-results) for i18n. */
  labels?: Partial<PlacesAutocompleteLabels>
  /**
   * Replace the default two-line option rendering. The component keeps
   * ownership of the <li>, its ARIA wiring and selection handling.
   */
  renderSuggestion?: (suggestion: Suggestion, active: () => boolean) => JSX.Element
}

export const PlacesAutocomplete: Component<PlacesAutocompleteProps> = (props) => {
  const [local, config] = splitProps(props, [
    'value',
    'placeholder',
    'onValueChange',
    'onSelect',
    'onError',
    'class',
    'labels',
    'renderSuggestion',
  ])

  const uid = createUniqueId()
  /*
   * Solid's `ref={rootRef}` JSX prop below assigns this during render via a
   * compiler transform the linter's data-flow analysis can't see — it is
   * not actually left unassigned.
   */
  // eslint-disable-next-line no-unassigned-vars -- see comment above
  let rootRef: HTMLDivElement | undefined

  const controller = createPlacesAutocomplete({
    ...config,
    onSelect: (place, suggestion) => local.onSelect?.(place, suggestion),
    onError: (error) => local.onError?.(error),
  })

  // Live config: reading {...config} inside the effect tracks every config
  // prop, so any change flows into the machine via setConfig() — no remount
  // needed. The initial run applies the values the controller was
  // constructed from, a harmless no-op.
  createEffect(() => {
    controller.setConfig({ ...config })
  })

  const [state, setState] = createSignal(controller.getState())
  const unsubscribe = controller.subscribe(() => setState(controller.getState()))

  onMount(() => {
    if (!rootRef) return
    const unbind = bindOutsideClose(rootRef, () => controller.close())
    onCleanup(unbind)
  })

  onCleanup(() => {
    unsubscribe()
    controller.destroy()
  })

  // Lets a parent reset the field (e.g. on form submit) by writing to
  // `value`; the guard avoids re-issuing setQuery for a no-op change.
  createEffect(() => {
    const value = local.value
    if (value !== undefined && value !== state().query) controller.setQuery(value)
  })

  function handleInput(event: InputEvent & { currentTarget: HTMLInputElement }): void {
    const next = event.currentTarget.value
    local.onValueChange?.(next)
    controller.setQuery(next)
  }

  function handleKeyDown(event: KeyboardEvent): void {
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
        if (state().isOpen) {
          event.preventDefault()
          controller.selectActive()
        }
        break
      case 'Escape':
        controller.close()
        break
    }
  }

  return (
    <div class={['gpa-root', local.class].filter(Boolean).join(' ')} ref={rootRef}>
      <input
        class="gpa-input"
        type="text"
        role="combobox"
        aria-expanded={state().isOpen}
        aria-autocomplete="list"
        aria-controls={`${uid}-panel`}
        aria-activedescendant={
          state().isOpen && state().activeIndex >= 0
            ? `${uid}-option-${state().activeIndex}`
            : undefined
        }
        autocomplete="off"
        placeholder={local.placeholder ?? local.labels?.placeholder ?? DEFAULT_LABELS.placeholder}
        value={state().query}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
      <Show when={state().isOpen}>
        <div class="gpa-panel" id={`${uid}-panel`}>
          <Show
            when={state().status !== 'loading'}
            fallback={
              <div class="gpa-status" role="status">
                {local.labels?.searching ?? DEFAULT_LABELS.searching}
              </div>
            }
          >
            <Show
              when={state().suggestions.length > 0}
              fallback={
                <div class="gpa-empty" role="status">
                  {local.labels?.noResults ?? DEFAULT_LABELS.noResults}
                </div>
              }
            >
              <ul class="gpa-listbox" role="listbox">
                <For each={state().suggestions}>
                  {(suggestion, index) => (
                    <li
                      id={`${uid}-option-${index()}`}
                      class="gpa-option"
                      role="option"
                      aria-selected={index() === state().activeIndex}
                      data-active={index() === state().activeIndex}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        controller.selectSuggestion(suggestion)
                      }}
                    >
                      <Show
                        when={local.renderSuggestion}
                        fallback={
                          <>
                            <div class="gpa-option-main">{suggestion.mainText}</div>
                            <Show when={suggestion.secondaryText}>
                              <div class="gpa-option-secondary">{suggestion.secondaryText}</div>
                            </Show>
                          </>
                        }
                      >
                        {local.renderSuggestion!(suggestion, () => index() === state().activeIndex)}
                      </Show>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  )
}
