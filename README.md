# @anil-labs/google-places-autocomplete

A typed address autocomplete built on Google's **Places API (New)** — debounced predictions, automatic session-token billing, keyboard navigation and resolved place details. Zero-dependency core, framework-idiomatic adapters for Vue, React, Svelte, Solid and Web Components.

[Documentation](https://anilkumarthakur60.github.io/google-places-autocomplete/) · [Live demos](https://anil-labs-google-places-autocomplete.vercel.app)

## Packages

| Package                                          | Description                          |
| --------------------------------------------------- | ---------------------------------------- |
| `@anil-labs/google-places-autocomplete-core`        | Framework-agnostic engine. Zero runtime dependencies. |
| `@anil-labs/google-places-autocomplete-vue`         | Vue 3 component + composable.        |
| `@anil-labs/google-places-autocomplete-react`       | React component + hook.              |
| `@anil-labs/google-places-autocomplete-svelte`      | Svelte 5 (runes) component.          |
| `@anil-labs/google-places-autocomplete-solid`       | Solid component.                     |
| `@anil-labs/google-places-autocomplete-element`     | Framework-free custom element (`<gpa-autocomplete>`). |

## Quick start

```sh
npm install @anil-labs/google-places-autocomplete-vue   # or -react / -svelte / -solid / -element
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-vue'
import '@anil-labs/google-places-autocomplete-core/styles.css'

const query = ref('')
</script>

<template>
  <PlacesAutocomplete
    v-model="query"
    api-key="YOUR_API_KEY"
    @select="(place) => console.log(place.formattedAddress)"
  />
</template>
```

See the [getting started guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) for Google Cloud setup (enabling Places API (New), restricting your key), and the [framework guides](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/frameworks/vue) for React/Svelte/Solid/Web Component usage.

## Why this over the legacy Autocomplete widget?

- **No Maps JS SDK.** Talks to `places.googleapis.com` with plain `fetch` — no script loader, no `google.maps` global.
- **Correct billing by default.** Autocomplete + Place Details share one session token automatically, matching Google's guidance for how the session-based pricing is supposed to work.
- **Bring your own key handling.** Pass `apiKey` directly, or override `fetcher` to proxy through your own backend and never expose a key to the browser.

See [Session tokens & billing](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/session-tokens) for the full detail.

## Theming

Every wrapper renders the same `.gpa-*` class names, styled by `@anil-labs/google-places-autocomplete-core/styles.css` via CSS custom properties (`--gpa-bg`, `--gpa-fg`, `--gpa-accent`, etc.) — override them on `.gpa-root` to theme, or replace the stylesheet entirely for full control.

## Accessibility

The input uses `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant` kept in sync with the highlighted suggestion; options use `role="option"`/`aria-selected`. Arrow keys move the highlight, <kbd>Enter</kbd> selects, <kbd>Escape</kbd> closes.

## Browser support

Any environment with `fetch`, `AbortController` and `crypto.randomUUID()` (with a fallback generator when the last one is unavailable) — effectively all evergreen browsers and Node ≥ 18.

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © Er. Anil Kumar Thakur
