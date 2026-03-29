# Vue

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

## Props

All [`PlacesAutocompleteConfig`](/api/core#placesautocompleteconfig) fields are accepted as props (in kebab-case, per Vue convention — e.g. `debounce-ms`, `region-code`), plus:

| Prop          | Type     | Default                     |
| ------------- | -------- | ---------------------------- |
| `modelValue`  | `string` | `''`                         |
| `placeholder` | `string` | `'Search for an address…'`   |

## Events

| Event                | Payload                                    |
| -------------------- | ------------------------------------------- |
| `update:modelValue`  | `(value: string)`                           |
| `select`              | `(place: PlaceDetails, suggestion: Suggestion)` |
| `error`               | `(error: PlacesAutocompleteError)`          |

`apiKey`/`debounceMs`/etc. are read once when the component is created — to change them, remount the component (e.g. wrap it in a `<template :key="...">` block) rather than expecting a live update.

## Headless usage

`usePlacesAutocomplete` is the composable the component itself is built on, if you want to render your own markup:

```ts
import { usePlacesAutocomplete } from '@anil-labs/google-places-autocomplete-vue'

const { state, controller } = usePlacesAutocomplete({ apiKey: 'YOUR_API_KEY' })
// state is a ShallowRef<PlacesAutocompleteState>; controller exposes
// setQuery/moveActive/selectActive/selectSuggestion/close/destroy.
```
