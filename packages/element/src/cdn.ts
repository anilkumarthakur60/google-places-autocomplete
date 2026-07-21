// Standalone CDN entry (the IIFE build's entry point — see tsup.config.ts).
//
// Registers the default <gpa-autocomplete> tag on load, so a single script tag
// is enough — no build step, no manual define() call:
//
//   <script src="https://unpkg.com/@anil-labs/google-places-autocomplete-element"></script>
//   <gpa-autocomplete api-key="..."></gpa-autocomplete>
//
// The named exports remain on the `GooglePlacesAutocomplete` global for anyone
// who wants a custom tag name.
import {
  GooglePlacesAutocompleteElement,
  defineGooglePlacesAutocompleteElement,
} from './GooglePlacesAutocompleteElement'

defineGooglePlacesAutocompleteElement()

export { GooglePlacesAutocompleteElement, defineGooglePlacesAutocompleteElement }
