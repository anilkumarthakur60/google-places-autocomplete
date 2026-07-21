# Web Component

The `<gpa-autocomplete>` custom element works in any framework — or none — since it's built directly on `core` with no framework runtime involved. It **self-injects its stylesheet** on first use, so there's no separate CSS import to remember.

## With a bundler

```sh
npm install @anil-labs/google-places-autocomplete-element
```

```html
<script type="module">
  import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'

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

## Via a CDN — no build step

The package ships a standalone, self-contained bundle (the engine and styles are baked in) that registers `<gpa-autocomplete>` automatically. One `<script>` tag is all you need — no bundler, no npm, no manual `define()` call:

```html
<!-- unpkg (or swap for jsdelivr: https://cdn.jsdelivr.net/npm/@anil-labs/google-places-autocomplete-element) -->
<script src="https://unpkg.com/@anil-labs/google-places-autocomplete-element"></script>

<gpa-autocomplete
  api-key="YOUR_API_KEY"
  placeholder="Search for an address…"
  region-code="us"
></gpa-autocomplete>

<script>
  document.querySelector('gpa-autocomplete').addEventListener('select', (event) => {
    console.log(event.detail.place.formattedAddress)
  })
</script>
```

Writing `<gpa-autocomplete>` directly in HTML like this is safe here: `api-key` and the other config attributes are read when the element connects, and since it's declared in the markup the browser already has them by then. (The `createElement`-then-configure dance below only matters when you construct the element from a separate script — see the note.)

Pin a version for production (e.g. `.../@anil-labs/google-places-autocomplete-element@0.2.0`) so a future release can't change the behavior underneath you. Since the whole engine is bundled into this file, don't also load `@anil-labs/google-places-autocomplete-core` separately — it would just ship the engine twice.

::: warning Configure before connecting (createElement usage)
`customElements.define()` synchronously upgrades any matching tag already parsed into the document — if you build the element from a script with `document.createElement` and set `api-key` *after* appending it, the element may connect and read its attributes first. Set the attributes before `append()` (as in the bundler example above), or just declare the tag with its attributes directly in HTML (as in the CDN example).
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
