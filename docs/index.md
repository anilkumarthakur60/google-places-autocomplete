---
layout: home
hero:
  name: '@anil-labs/google-places-autocomplete'
  text: Typed address autocomplete
  tagline: Built on Google's Places API (New) — debounced predictions, automatic session-token billing, keyboard navigation and resolved place details. Zero-dependency core, framework-idiomatic adapters.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/anilkumarthakur60/google-places-autocomplete

features:
  - title: Zero-dependency core
    details: The engine talks to Google's REST API with plain fetch — no Maps JS SDK script loader, no global namespace.
  - title: Correct session billing
    details: Autocomplete + Place Details share one session token automatically, matching Google's billing guidance — you don't have to think about it.
  - title: Every major framework
    details: Idiomatic components for Vue, React, Svelte and Solid, plus a framework-free Web Component for everything else.
  - title: Bring your own key handling
    details: Pass an apiKey directly, or override the fetcher to proxy requests through your own backend and keep the key server-side.
---
