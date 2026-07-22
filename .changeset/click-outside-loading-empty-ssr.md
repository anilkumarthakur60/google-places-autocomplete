---
"@anil-labs/google-places-autocomplete-core": minor
"@anil-labs/google-places-autocomplete-vue": minor
"@anil-labs/google-places-autocomplete-react": minor
"@anil-labs/google-places-autocomplete-svelte": minor
"@anil-labs/google-places-autocomplete-solid": minor
"@anil-labs/google-places-autocomplete-element": minor
---

Close the suggestion panel on an outside click (previously only `Escape` or a selection closed it), show a loading indicator while a search is in flight, and show a "No results found" message instead of silently hiding when a search returns nothing.

Fixed a bug where the Web Component package (`@anil-labs/google-places-autocomplete-element`) threw `ReferenceError: HTMLElement is not defined` when imported during server-side rendering (Next.js/Nuxt/SvelteKit server-render the whole module graph by default, even for client-only code).
