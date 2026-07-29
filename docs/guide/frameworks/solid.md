# Solid

```tsx
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-solid'
import '@anil-labs/google-places-autocomplete-core/styles.css'
import type { PlaceDetails } from '@anil-labs/google-places-autocomplete-core'

export function App() {
  return (
    <PlacesAutocomplete
      apiKey="YOUR_API_KEY"
      placeholder="Search for an address…"
      onSelect={(place: PlaceDetails) => console.log(place.formattedAddress)}
      onError={(error) => console.error(error)}
    />
  )
}
```

## Props

All [`PlacesAutocompleteConfig`](/api/core#placesautocompleteconfig) fields are accepted as props, plus:

| Prop            | Type                          | Notes                                                |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| `value`           | `string`                      | Controlled input value. Omit for uncontrolled usage.   |
| `onValueChange`   | `(value: string) => void`     |                                                          |
| `onSelect`        | `(place, suggestion) => void` |                                                          |
| `onError`         | `(error) => void`             |                                                          |
| `placeholder`     | `string`                      |                                                          |
| `class`           | `string`                      | Merged onto the root `<div>`.                          |

`apiKey`/`debounceMs`/etc. are read once when the component is created, matching the other wrappers — apply a change by remounting rather than expecting a live update.

## Custom suggestion rendering

`renderSuggestion` replaces the default two-line option content; the component keeps the `<li>`, its ARIA wiring and selection handling. `active` is an accessor so your JSX stays reactive:

```tsx
<PlacesAutocomplete
  apiKey="YOUR_API_KEY"
  renderSuggestion={(s, active) => (
    <>
      <strong>{s.mainText}</strong>
      {s.distanceMeters != null && <small> · {(s.distanceMeters / 1000).toFixed(1)} km</small>}
    </>
  )}
/>
```

## Labels (i18n)

```tsx
<PlacesAutocomplete
  apiKey="YOUR_API_KEY"
  labels={{ searching: 'Khojdai…', noResults: 'Kehi bhetiyena' }}
/>
```
