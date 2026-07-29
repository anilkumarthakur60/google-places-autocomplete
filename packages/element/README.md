# @anil-labs/google-places-autocomplete-element

Framework-free `<gpa-autocomplete>` custom element for address autocomplete, built on Google's Places API (New). Works in any framework — or none. Self-injects its stylesheet, so there's no separate CSS import.

## Via a CDN — no build step

The package ships a standalone bundle (engine + styles baked in) that auto-registers `<gpa-autocomplete>`. One script tag, zero setup:

```html
<script src="https://unpkg.com/@anil-labs/google-places-autocomplete-element"></script>

<gpa-autocomplete api-key="YOUR_API_KEY" placeholder="Search for an address…"></gpa-autocomplete>

<script>
  document.querySelector('gpa-autocomplete').addEventListener('select', (event) => {
    console.log(event.detail.place.formattedAddress)
  })
</script>
```

Pin a version in production (`.../@anil-labs/google-places-autocomplete-element@x.y.z`). The engine is bundled in, so don't also load `-core` separately.

## With a bundler

```sh
npm install @anil-labs/google-places-autocomplete-element
```

```html
<script type="module">
  import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'

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

> **Configure before connecting.** `customElements.define()` synchronously upgrades any matching tag already parsed into the document — building the element from a script and setting `api-key` *after* appending it may connect it first. Set attributes before `append()` (as above), or declare the tag with its attributes directly in HTML (as in the CDN example).

Full documentation: [Web Component guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/frameworks/web-component) · [getting started](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) (Google Cloud setup) · [API reference](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core).

## Attributes

`api-key`, `debounce-ms`, `min-length`, `language-code`, `region-code` (read once at first connection), plus `value` and `placeholder` (live-updatable at any time).

## Events

`select` (`detail: { place, suggestion }`), `gpaerror` (`detail: { error }` — named to avoid ambiguity with the DOM's built-in `error` event).

## SSR-safe

Safe to import during server-side rendering (Next.js/Nuxt/SvelteKit) — the module doesn't reference `HTMLElement`/`customElements` at load time, only when actually connected in a browser.

## License

MIT © Er. Anil Kumar Thakur
