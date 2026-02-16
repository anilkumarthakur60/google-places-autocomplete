<script lang="ts">
  import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-svelte'
  import { getDemoApiKey, DEMO_CONFIG } from '../../shared/src/config'
  import type {
    PlaceDetails,
    PlacesAutocompleteError,
  } from '@anil-labs/google-places-autocomplete-core'

  const apiKey = getDemoApiKey()
  let selected = $state<PlaceDetails | null>(null)
  let errorMessage = $state<string | null>(null)

  function handleSelect(place: PlaceDetails): void {
    selected = place
    errorMessage = null
  }

  function handleError(error: PlacesAutocompleteError): void {
    errorMessage = error.message
  }
</script>

<main class="demo">
  <h1>@anil-labs/google-places-autocomplete — Svelte</h1>
  <p class="tag">
    Type an address below. Selecting a suggestion resolves the full place via the same session.
  </p>
  <PlacesAutocomplete
    {apiKey}
    debounceMs={DEMO_CONFIG.debounceMs}
    minLength={DEMO_CONFIG.minLength}
    regionCode={DEMO_CONFIG.regionCode}
    languageCode={DEMO_CONFIG.languageCode}
    placeholder="Start typing an address…"
    onSelect={handleSelect}
    onError={handleError}
  />
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  {#if selected}
    <pre>{JSON.stringify(selected, null, 2)}</pre>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
    background: #f7f7f8;
  }
  .demo {
    max-width: 560px;
    margin: 0 auto;
    padding: 48px 20px;
  }
  h1 {
    font-size: 22px;
  }
  .tag {
    color: #555;
    font-size: 14px;
  }
  .error {
    color: #b91c1c;
    font-size: 14px;
  }
  pre {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
  }
</style>
