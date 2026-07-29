# Svelte

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

## Props

All [`PlacesAutocompleteConfig`](/api/core#placesautocompleteconfig) fields are accepted as props, plus:

| Prop          | Type                                          | Notes                     |
| ------------- | ---------------------------------------------- | -------------------------- |
| `value`        | `string` (bindable via `bind:value`)           | Defaults to `''`.          |
| `placeholder` | `string`                                       |                            |
| `onSelect`     | `(place: PlaceDetails, suggestion: Suggestion) => void` |                   |
| `onError`      | `(error: PlacesAutocompleteError) => void`     |                            |

Requires Svelte 5 (runes mode). `apiKey`/`debounceMs`/etc. are read once when the component is created — apply a change by remounting (e.g. with an `{#key ...}` block) rather than expecting it to update live.

## Custom suggestion rendering

The `suggestion` snippet replaces the default two-line option content; the component keeps the `<li>`, its ARIA wiring and selection handling:

```svelte
<PlacesAutocomplete apiKey="YOUR_API_KEY">
  {#snippet suggestion({ suggestion, active })}
    <strong>{suggestion.mainText}</strong>
    {#if suggestion.distanceMeters != null}
      <small> · {(suggestion.distanceMeters / 1000).toFixed(1)} km</small>
    {/if}
  {/snippet}
</PlacesAutocomplete>
```

## Labels (i18n)

```svelte
<PlacesAutocomplete
  apiKey="YOUR_API_KEY"
  labels={{ searching: 'Khojdai…', noResults: 'Kehi bhetiyena' }}
/>
```
