# @anil-labs/google-places-autocomplete-svelte

Svelte 5 (runes) address autocomplete component built on Google's Places API (New).

## Install

```sh
npm install @anil-labs/google-places-autocomplete-svelte
```

## Usage

```svelte
<script lang="ts">
  import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-svelte'
  import '@anil-labs/google-places-autocomplete-core/styles.css'
  import type { PlaceDetails } from '@anil-labs/google-places-autocomplete-core'

  let query = $state('')
</script>

<PlacesAutocomplete
  bind:value={query}
  apiKey="YOUR_API_KEY"
  placeholder="Search for an address…"
  onSelect={(place: PlaceDetails) => console.log(place.formattedAddress)}
  onError={(error) => console.error(error)}
/>
```

Full documentation: [Svelte guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/frameworks/svelte) · [getting started](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) (Google Cloud setup) · [API reference](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core).

## Props

All [`PlacesAutocompleteConfig`](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core#placesautocompleteconfig) fields, plus `value` (bindable via `bind:value`), `placeholder`, `onSelect`, `onError`. Requires Svelte 5 (runes mode). `apiKey`/`debounceMs`/etc. are read once at construction — remount to change them.

## License

MIT © Er. Anil Kumar Thakur
