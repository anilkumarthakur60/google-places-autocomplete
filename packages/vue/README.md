# @anil-labs/google-places-autocomplete-vue

Vue 3 address autocomplete component built on Google's Places API (New).

## Install

```sh
npm install @anil-labs/google-places-autocomplete-vue
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-vue'
import '@anil-labs/google-places-autocomplete-core/styles.css'
import type { PlaceDetails } from '@anil-labs/google-places-autocomplete-core'

const query = ref('')

function handleSelect(place: PlaceDetails) {
  console.log(place.formattedAddress)
}
</script>

<template>
  <PlacesAutocomplete
    v-model="query"
    api-key="YOUR_API_KEY"
    placeholder="Search for an address…"
    @select="handleSelect"
    @error="(err) => console.error(err)"
  />
</template>
```

Full documentation: [Vue guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/frameworks/vue) · [getting started](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) (Google Cloud setup) · [API reference](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core).

## Props

All [`PlacesAutocompleteConfig`](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core#placesautocompleteconfig) fields, in kebab-case (`debounce-ms`, `region-code`, ...), plus `modelValue` and `placeholder`. `apiKey`/`debounceMs`/etc. are read once at construction — remount to change them.

## Events

`update:modelValue`, `select` (`place, suggestion`), `error`.

## Headless usage

`usePlacesAutocomplete` — the composable the component is built on — is also exported, for custom markup.

## License

MIT © Er. Anil Kumar Thakur
