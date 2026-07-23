# React

```tsx
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-react'
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

| Prop            | Type                        | Notes                                                             |
| ---------------- | --------------------------- | ------------------------------------------------------------------ |
| `value`           | `string`                    | Controlled input value. Omit for uncontrolled usage.               |
| `onValueChange`   | `(value: string) => void`   | Fires on every keystroke.                                          |
| `onSelect`        | `(place, suggestion) => void` |                                                                    |
| `onError`         | `(error) => void`           |                                                                    |
| `placeholder`     | `string`                    |                                                                    |
| `className`       | `string`                    | Merged onto the root `<div>`.                                     |

`onSelect`/`onError` are always safe to pass a fresh inline function every render — they're read from a ref internally, so they never go stale. Other config (`apiKey`, `debounceMs`, etc.) is read once when the component mounts; remount via a `key` prop to apply a change.

## Custom suggestion rendering

`renderSuggestion` replaces the default two-line option content; the component keeps the `<li>`, its ARIA wiring and selection handling:

```tsx
<PlacesAutocomplete
  apiKey="YOUR_API_KEY"
  renderSuggestion={(s, { active }) => (
    <>
      <strong>{s.mainText}</strong>
      {s.distanceMeters != null && <small> · {(s.distanceMeters / 1000).toFixed(1)} km</small>}
    </>
  )}
/>
```

`s.mainTextMatches` carries the matched ranges if you want to bold the typed part.

## Labels (i18n)

```tsx
<PlacesAutocomplete
  apiKey="YOUR_API_KEY"
  labels={{ searching: 'Khojdai…', noResults: 'Kehi bhetiyena' }}
/>
```

## Headless usage

`usePlacesAutocomplete` is the hook the component is built on (`useSyncExternalStore` under the hood), if you want to render your own markup:

```tsx
import { usePlacesAutocomplete } from '@anil-labs/google-places-autocomplete-react'

function MyInput() {
  const { state, controller } = usePlacesAutocomplete({ apiKey: 'YOUR_API_KEY' })
  return <input value={state.query} onChange={(e) => controller.setQuery(e.target.value)} />
}
```
