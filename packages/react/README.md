# @anil-labs/google-places-autocomplete-react

React address autocomplete component built on Google's Places API (New).

## Install

```sh
npm install @anil-labs/google-places-autocomplete-react
```

## Usage

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

Full documentation: [React guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/frameworks/react) · [getting started](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) (Google Cloud setup) · [API reference](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core).

## Props

All [`PlacesAutocompleteConfig`](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core#placesautocompleteconfig) fields, plus `value`/`onValueChange` (controlled input), `onSelect`, `onError`, `placeholder`, `className`. `onSelect`/`onError` are always safe as fresh inline functions; other config is read once at mount — remount via a `key` prop to change it.

## Headless usage

`usePlacesAutocomplete` — the hook the component is built on (`useSyncExternalStore` under the hood) — is also exported, for custom markup.

## License

MIT © Er. Anil Kumar Thakur
