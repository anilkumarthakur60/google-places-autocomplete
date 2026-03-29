# Web Component

The `<gpa-autocomplete>` custom element works in any framework — or none — since it's built directly on `core` with no framework runtime involved.

```html
<script type="module">
  import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'
  import '@anil-labs/google-places-autocomplete-core/styles.css'

  defineGooglePlacesAutocompleteElement('gpa-autocomplete')

  // Configure BEFORE inserting into the document — see the note below.
  const el = document.createElement('gpa-autocomplete')
  el.setAttribute('api-key', 'YOUR_API_KEY')
  el.setAttribute('placeholder', 'Search for an address…')
  el.addEventListener('select', (event) => console.log(event.detail.place.formattedAddress))
  el.addEventListener('gpaerror', (event) => console.error(event.detail.error))
  document.body.append(el)
</script>
```

::: warning Configure before connecting
`customElements.define()` synchronously upgrades any matching tag already parsed into the document — if you write `<gpa-autocomplete api-key="...">` directly in static HTML, the element may connect (and read its attributes) before your script has a chance to set them, depending on script placement. Creating it with `document.createElement`, configuring it, and only then appending it (as above) sidesteps that entirely.
:::

## Attributes

| Attribute        | Maps to                        |
| ----------------- | -------------------------------- |
| `api-key`          | `apiKey`                        |
| `value`            | live-updatable; see below        |
| `placeholder`      | live-updatable                  |
| `debounce-ms`      | `debounceMs` (number)            |
| `min-length`       | `minLength` (number)             |
| `language-code`    | `languageCode`                  |
| `region-code`      | `regionCode`                    |

`api-key`/`debounce-ms`/`min-length`/`language-code`/`region-code` are read once at first connection. `value` and `placeholder` are the two exceptions — they're cheap to apply live without reconstructing the controller, so changing them after the element is connected works as expected (e.g. a parent form resetting the field via `el.value = ''`).

## JS-only properties

For config that doesn't fit in a string attribute, set these directly on the element instance before connecting it:

```ts
el.fetcher = (input, init) => fetch('/api/places-proxy', init)
el.locationBias = { circle: { center: { latitude: 37.4, longitude: -122.1 }, radius: 5000 } }
el.includedRegionCodes = ['us']
el.placeFields = ['id', 'displayName', 'formattedAddress']
el.resolveDetails = true // default
```

## Events

| Event        | `detail`                                          |
| ------------- | ---------------------------------------------------- |
| `select`       | `{ place: PlaceDetails, suggestion: Suggestion }`     |
| `gpaerror`     | `{ error: PlacesAutocompleteError }`                 |

(Named `gpaerror` rather than `error` to avoid any ambiguity with the DOM's built-in `error` event.)
