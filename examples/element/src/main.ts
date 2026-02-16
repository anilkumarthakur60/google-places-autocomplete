import '@anil-labs/google-places-autocomplete-core/styles.css'
import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'
import { DEMO_CONFIG, getDemoApiKey } from '../../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

defineGooglePlacesAutocompleteElement('gpa-autocomplete')

const container = document.getElementById('autocomplete-container')
const errorEl = document.getElementById('error')
const outputEl = document.getElementById('output')
if (!container || !errorEl || !outputEl) throw new Error('Missing expected #id elements')

// Configure BEFORE inserting into the document: once connected, apiKey/etc.
// are read once (see GooglePlacesAutocompleteElement's class doc) — setting
// them first avoids the controller ever seeing empty attributes.
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
