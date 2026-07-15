# @anil-labs/google-places-autocomplete-core

Framework-agnostic engine for Google Places Autocomplete (New): debounced predictions, automatic session-token billing, keyboard navigation and place-details resolution. Zero runtime dependencies — talks to `places.googleapis.com` with plain `fetch`, no Maps JavaScript SDK, no global namespace.

This is the shared engine behind [`@anil-labs/google-places-autocomplete-vue`](https://www.npmjs.com/package/@anil-labs/google-places-autocomplete-vue), `-react`, `-svelte`, `-solid` and `-element`. Install one of those directly unless you're building your own binding.

## Install

```sh
npm install @anil-labs/google-places-autocomplete-core
```

## Usage

```ts
import { createPlacesAutocomplete } from '@anil-labs/google-places-autocomplete-core'

const controller = createPlacesAutocomplete({
  apiKey: 'YOUR_API_KEY',
  onSelect: (place, suggestion) => console.log(place.formattedAddress),
})

controller.subscribe(() => {
  const state = controller.getState()
  // state.query, state.suggestions, state.status, state.isOpen, ...
})

controller.setQuery('1600 amphi')
```

See the [full API reference](https://anilkumarthakur60.github.io/google-places-autocomplete/api/core) and the [getting started guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) (Google Cloud setup, key restriction).

## Why this over the legacy Autocomplete widget?

- **No Maps JS SDK** — plain `fetch`, works anywhere `fetch`/`AbortController`/`crypto.randomUUID()` exist.
- **Correct session billing by default** — Autocomplete + Place Details share one session token automatically.
- **Bring your own key handling** — pass `apiKey` directly, or override `fetcher` to proxy through your own backend.

See [Session tokens & billing](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/session-tokens) for the full detail.

## Styling

`./styles.css` provides a minimal, CSS-custom-property-based baseline (`.gpa-root`, `.gpa-input`, `.gpa-panel`, `.gpa-listbox`, `.gpa-option`, `.gpa-status`, `.gpa-empty`) shared by every wrapper package:

```ts
import '@anil-labs/google-places-autocomplete-core/styles.css'
```

Override the custom properties (`--gpa-bg`, `--gpa-fg`, `--gpa-accent`, etc.) on `.gpa-root` to theme.

## License

MIT © Er. Anil Kumar Thakur
