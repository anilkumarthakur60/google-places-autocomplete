# @anil-labs/google-places-autocomplete-element

Framework-free `<gpa-autocomplete>` custom element for address autocomplete, built on Google's Places API (New). Works in any framework — or none.

## Install

```sh
npm install @anil-labs/google-places-autocomplete-element
```

## Usage

```html
<script type="module">
  import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'
  import '@anil-labs/google-places-autocomplete-core/styles.css'

  defineGooglePlacesAutocompleteElement('gpa-autocomplete')

  // Configure BEFORE inserting into the document (see the warning below).
  const el = document.createElement('gpa-autocomplete')
  el.setAttribute('api-key', 'YOUR_API_KEY')
  el.setAttribute('placeholder', 'Search for an address…')
  el.addEventListener('select', (event) => console.log(event.detail.place.formattedAddress))
  el.addEventListener('gpaerror', (event) => console.error(event.detail.error))
  document.body.append(el)
</script>
```

> **Configure before connecting.** `customElements.define()` synchronously upgrades any matching tag already parsed into the document — writing `<gpa-autocomplete api-key="...">` directly in static HTML may connect it before your script sets attributes, depending on script placement. Creating it with `document.createElement`, configuring it, and only then appending it (as above) avoids that entirely.

Full documentation: [Web Component guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/frameworks/web-component) · [getting started](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) (Google Cloud setup) · [API reference](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core).

## Attributes

`api-key`, `debounce-ms`, `min-length`, `language-code`, `region-code` (read once at first connection), plus `value` and `placeholder` (live-updatable at any time).

## Events

`select` (`detail: { place, suggestion }`), `gpaerror` (`detail: { error }` — named to avoid ambiguity with the DOM's built-in `error` event).

## SSR-safe

Safe to import during server-side rendering (Next.js/Nuxt/SvelteKit) — the module doesn't reference `HTMLElement`/`customElements` at load time, only when actually connected in a browser.

## License

MIT © Er. Anil Kumar Thakur
