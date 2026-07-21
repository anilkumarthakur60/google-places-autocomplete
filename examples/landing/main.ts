// No CSS import needed — the element self-injects the stylesheet on connect.
import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'
import { DEMO_CONFIG, getDemoApiKey } from '../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

defineGooglePlacesAutocompleteElement('gpa-autocomplete')

const container = document.getElementById('autocomplete-container')
const errorEl = document.getElementById('error')
const outputEl = document.getElementById('output')
const versionEl = document.getElementById('version')
if (!container || !errorEl || !outputEl) throw new Error('Missing expected #id elements')

if (versionEl) versionEl.textContent = `v${__PKG_VERSION__}`

// Configure before inserting: see examples/element/src/main.ts for why this
// order matters (customElements.define() upgrades an already-connected
// element synchronously, before a later setAttribute call would land).
const el = document.createElement('gpa-autocomplete')
el.setAttribute('placeholder', 'Start typing an address…')
el.setAttribute('api-key', getDemoApiKey())
el.setAttribute('debounce-ms', String(DEMO_CONFIG.debounceMs))
el.setAttribute('min-length', String(DEMO_CONFIG.minLength))
el.setAttribute('region-code', DEMO_CONFIG.regionCode)
el.setAttribute('language-code', DEMO_CONFIG.languageCode)

el.addEventListener('select', (event) => {
  const { place } = (event as CustomEvent<{ place: PlaceDetails; suggestion: Suggestion }>).detail
  outputEl.hidden = false
  outputEl.textContent = JSON.stringify(place, null, 2)
  errorEl.hidden = true
})

el.addEventListener('gpaerror', (event) => {
  const { error } = (event as CustomEvent<{ error: PlacesAutocompleteError }>).detail
  errorEl.hidden = false
  errorEl.textContent = error.message
})

container.append(el)
