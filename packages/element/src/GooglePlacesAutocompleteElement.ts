import {
  bindOutsideClose,
  createPlacesAutocomplete,
} from '@anil-labs/google-places-autocomplete-core'
import type {
  Fetcher,
  LocationBias,
  PlaceDetails,
  PlacesAutocompleteConfig,
  PlacesAutocompleteController,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'
// Inlined as a string at build time (see tsup.config.ts) and injected on first
// connect, so the element is self-styling — no separate CSS import needed,
// including via a plain <script> tag from a CDN.
import styles from '@anil-labs/google-places-autocomplete-core/styles.css'

const OBSERVED_ATTRIBUTES = [
  'value',
  'placeholder',
  'api-key',
  'debounce-ms',
  'min-length',
  'language-code',
  'region-code',
] as const

const STYLE_ID = 'gpa-autocomplete-styles'

/** Inject the shared stylesheet once per document (idempotent via the id). */
function injectStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = styles
  document.head.append(style)
}

let uidCounter = 0

// Under SSR/Node, `HTMLElement` doesn't exist at all — merely evaluating
// `class X extends HTMLElement` throws the moment this module is imported
// (class-extends resolves its base identifier immediately, not lazily),
// which crashes frameworks like Next.js/Nuxt/SvelteKit that server-render
// the whole module graph by default, even for code that only ever runs
// client-side. Falling back to a plain empty base class under SSR lets the
// module load safely; the class stays inert (never actually instantiated)
// until customElements.define() runs, which itself no-ops under SSR below.
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement)

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
export class GooglePlacesAutocompleteElement extends HTMLElementBase {
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
  #unbindOutsideClose: (() => void) | null = null
  #input: HTMLInputElement | null = null
  #panel: HTMLDivElement | null = null
  #uid = `gpa-${++uidCounter}`

  connectedCallback(): void {
    injectStyles()
    this.classList.add('gpa-root')
    this.#renderShell()
    this.#createController()
    this.#unbindOutsideClose = bindOutsideClose(this, () => this.#controller?.close())
  }

  disconnectedCallback(): void {
    this.#unbindOutsideClose?.()
    this.#unbindOutsideClose = null
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
    input.setAttribute('aria-controls', `${this.#uid}-panel`)
    input.autocomplete = 'off'
    input.placeholder = this.getAttribute('placeholder') ?? 'Search for an address…'
    input.addEventListener('input', () => this.#controller?.setQuery(input.value))
    input.addEventListener('keydown', (event) => this.#handleKeydown(event))

    const panel = document.createElement('div')
    panel.className = 'gpa-panel'
    panel.id = `${this.#uid}-panel`
    panel.hidden = true

    this.append(input, panel)
    this.#input = input
    this.#panel = panel
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
    const panel = this.#panel
    if (!controller || !input || !panel) return
    const state = controller.getState()

    if (input.value !== state.query) input.value = state.query
    input.setAttribute('aria-expanded', String(state.isOpen))
    if (state.isOpen && state.activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `${this.#uid}-option-${state.activeIndex}`)
    } else {
      input.removeAttribute('aria-activedescendant')
    }

    panel.hidden = !state.isOpen
    if (!state.isOpen) {
      panel.replaceChildren()
      return
    }

    if (state.status === 'loading') {
      panel.replaceChildren(this.#renderStatus('gpa-status', 'Searching…'))
      return
    }
    if (state.suggestions.length === 0) {
      panel.replaceChildren(this.#renderStatus('gpa-empty', 'No results found'))
      return
    }

    const listbox = document.createElement('ul')
    listbox.className = 'gpa-listbox'
    listbox.setAttribute('role', 'listbox')
    listbox.append(
      ...state.suggestions.map((suggestion, index) =>
        this.#renderOption(suggestion, index, state.activeIndex),
      ),
    )
    panel.replaceChildren(listbox)
  }

  #renderStatus(className: string, text: string): HTMLDivElement {
    const div = document.createElement('div')
    div.className = className
    div.setAttribute('role', 'status')
    div.textContent = text
    return div
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
  if (typeof customElements === 'undefined') return // no-op under SSR
  if (!customElements.get(tagName)) {
    customElements.define(tagName, GooglePlacesAutocompleteElement)
  }
}
