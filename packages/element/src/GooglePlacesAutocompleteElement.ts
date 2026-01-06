import { createPlacesAutocomplete } from '@anil-labs/google-places-autocomplete-core'
import type {
  Fetcher,
  LocationBias,
  PlaceDetails,
  PlacesAutocompleteConfig,
  PlacesAutocompleteController,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

const OBSERVED_ATTRIBUTES = [
  'value',
  'placeholder',
  'api-key',
  'debounce-ms',
  'min-length',
  'language-code',
  'region-code',
] as const

let uidCounter = 0

/**
 * A framework-free custom element. Renders into light DOM (not a shadow
 * root) so it picks up the same `.gpa-*` classes — and the same imported
 * `@anil-labs/google-places-autocomplete-core/styles.css` — as every other
 * wrapper, rather than needing its own duplicated/inlined stylesheet.
 *
 * `apiKey`/`debounceMs`/etc. are read once, at first connection, matching
 * every other wrapper's "construct once" behavior — change them by
 * recreating the element, not by mutating attributes after the fact.
 * `value` and `placeholder` are the two exceptions: they're small, expected
 * to change live (e.g. a parent form resetting the field), and cheap to
 * apply without reconstructing the whole controller.
 */
export class GooglePlacesAutocompleteElement extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return OBSERVED_ATTRIBUTES
  }

  /** JS-only config for values that don't fit in an HTML attribute. */
  fetcher?: Fetcher
  locationBias?: LocationBias
  includedRegionCodes?: string[]
  placeFields?: readonly string[]
  resolveDetails?: boolean

  #controller: PlacesAutocompleteController | null = null
  #unsubscribe: (() => void) | null = null
  #input: HTMLInputElement | null = null
  #listbox: HTMLUListElement | null = null
  #uid = `gpa-${++uidCounter}`

  connectedCallback(): void {
    this.classList.add('gpa-root')
    this.#renderShell()
    this.#createController()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#controller?.destroy()
    this.#controller = null
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.#controller) return
    if (name === 'value' && newValue !== null && newValue !== this.#controller.getState().query) {
      this.#controller.setQuery(newValue)
    } else if (name === 'placeholder' && this.#input) {
      this.#input.placeholder = newValue ?? ''
    }
  }

  get value(): string {
    return this.#controller?.getState().query ?? this.getAttribute('value') ?? ''
  }

  set value(next: string) {
    if (this.#controller) this.#controller.setQuery(next)
    else this.setAttribute('value', next)
  }

  #numberAttribute(name: string): number | undefined {
    const raw = this.getAttribute(name)
    if (raw === null) return undefined
    const parsed = Number(raw)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  #createController(): void {
    const config: PlacesAutocompleteConfig = {
      apiKey: this.getAttribute('api-key') ?? undefined,
      fetcher: this.fetcher,
      debounceMs: this.#numberAttribute('debounce-ms'),
      minLength: this.#numberAttribute('min-length'),
      languageCode: this.getAttribute('language-code') ?? undefined,
      regionCode: this.getAttribute('region-code') ?? undefined,
      includedRegionCodes: this.includedRegionCodes,
      locationBias: this.locationBias,
      resolveDetails: this.resolveDetails,
      placeFields: this.placeFields,
      onSelect: (place: PlaceDetails, suggestion: Suggestion) => {
        this.dispatchEvent(
          new CustomEvent('select', { detail: { place, suggestion }, bubbles: true }),
        )
      },
      onError: (error) => {
        this.dispatchEvent(new CustomEvent('gpaerror', { detail: { error }, bubbles: true }))
      },
    }

    this.#controller = createPlacesAutocomplete(config)
    const initialValue = this.getAttribute('value')
    if (initialValue) this.#controller.setQuery(initialValue)

    this.#unsubscribe = this.#controller.subscribe(() => this.#syncFromState())
    this.#syncFromState()
  }

  #renderShell(): void {
    const input = document.createElement('input')
    input.className = 'gpa-input'
    input.type = 'text'
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-controls', `${this.#uid}-listbox`)
    input.autocomplete = 'off'
    input.placeholder = this.getAttribute('placeholder') ?? 'Search for an address…'
    input.addEventListener('input', () => this.#controller?.setQuery(input.value))
    input.addEventListener('keydown', (event) => this.#handleKeydown(event))

    const listbox = document.createElement('ul')
    listbox.className = 'gpa-listbox'
    listbox.id = `${this.#uid}-listbox`
    listbox.setAttribute('role', 'listbox')
    listbox.hidden = true

    this.append(input, listbox)
    this.#input = input
    this.#listbox = listbox
  }

  #handleKeydown(event: KeyboardEvent): void {
    const controller = this.#controller
    if (!controller) return
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
        if (controller.getState().isOpen) {
          event.preventDefault()
          controller.selectActive()
        }
        break
      case 'Escape':
        controller.close()
        break
    }
  }

  #syncFromState(): void {
    const controller = this.#controller
    const input = this.#input
    const listbox = this.#listbox
    if (!controller || !input || !listbox) return
    const state = controller.getState()

    if (input.value !== state.query) input.value = state.query
    input.setAttribute('aria-expanded', String(state.isOpen))
    if (state.isOpen && state.activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `${this.#uid}-option-${state.activeIndex}`)
    } else {
      input.removeAttribute('aria-activedescendant')
    }

    const shouldShow = state.isOpen && state.suggestions.length > 0
    listbox.hidden = !shouldShow
    listbox.replaceChildren(
      ...state.suggestions.map((suggestion, index) =>
        this.#renderOption(suggestion, index, state.activeIndex),
      ),
    )
  }

  #renderOption(suggestion: Suggestion, index: number, activeIndex: number): HTMLLIElement {
    const li = document.createElement('li')
    li.id = `${this.#uid}-option-${index}`
    li.className = 'gpa-option'
    li.setAttribute('role', 'option')
    const isActive = index === activeIndex
    li.setAttribute('aria-selected', String(isActive))
    li.dataset.active = String(isActive)

    const main = document.createElement('div')
    main.className = 'gpa-option-main'
    main.textContent = suggestion.mainText
    li.append(main)

    if (suggestion.secondaryText) {
      const secondary = document.createElement('div')
      secondary.className = 'gpa-option-secondary'
      secondary.textContent = suggestion.secondaryText
      li.append(secondary)
    }

    li.addEventListener('mousedown', (event) => {
      event.preventDefault()
      this.#controller?.selectSuggestion(suggestion)
    })

    return li
  }
}

export function defineGooglePlacesAutocompleteElement(tagName = 'gpa-autocomplete'): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, GooglePlacesAutocompleteElement)
  }
}
