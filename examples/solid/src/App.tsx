import { createSignal, Show } from 'solid-js'
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-solid'
import { DEMO_CONFIG, getDemoApiKey } from '../../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
} from '@anil-labs/google-places-autocomplete-core'

const apiKey = getDemoApiKey()

export function App() {
  const [selected, setSelected] = createSignal<PlaceDetails | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

  return (
    <main class="demo">
      <h1>@anil-labs/google-places-autocomplete — Solid</h1>
      <p class="tag">
        Type an address below. Selecting a suggestion resolves the full place via the same session.
      </p>
      <PlacesAutocomplete
        apiKey={apiKey}
        debounceMs={DEMO_CONFIG.debounceMs}
        minLength={DEMO_CONFIG.minLength}
        regionCode={DEMO_CONFIG.regionCode}
        languageCode={DEMO_CONFIG.languageCode}
        placeholder="Start typing an address…"
        onSelect={(place: PlaceDetails) => {
          setSelected(place)
          setErrorMessage(null)
        }}
        onError={(error: PlacesAutocompleteError) => setErrorMessage(error.message)}
      />
      <Show when={errorMessage()}>
        <p class="error">{errorMessage()}</p>
      </Show>
      <Show when={selected()}>{(place) => <pre>{JSON.stringify(place(), null, 2)}</pre>}</Show>
      <style>{`
        body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background: #f7f7f8; }
        .demo { max-width: 560px; margin: 0 auto; padding: 48px 20px; }
        h1 { font-size: 22px; }
        .tag { color: #555; font-size: 14px; }
        .error { color: #b91c1c; font-size: 14px; }
        pre { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; overflow-x: auto; }
      `}</style>
    </main>
  )
}
