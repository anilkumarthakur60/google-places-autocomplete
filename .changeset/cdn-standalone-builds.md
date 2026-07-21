---
"@anil-labs/google-places-autocomplete-core": minor
"@anil-labs/google-places-autocomplete-element": minor
---

Add standalone browser builds for no-bundler/CDN usage.

- `core` now also ships an IIFE build (`dist/index.global.js`, exposed as `window.GooglePlacesAutocompleteCore`) referenced by the `unpkg`/`jsdelivr` fields.
- `element` now ships a self-contained IIFE build that bundles the engine, inlines the stylesheet, and auto-registers `<gpa-autocomplete>` — so a single `<script src="https://unpkg.com/@anil-labs/google-places-autocomplete-element">` tag works with zero setup.
- The element now self-injects its stylesheet on connect (in every build), so a separate `@anil-labs/google-places-autocomplete-core/styles.css` import is no longer required when using the element.
