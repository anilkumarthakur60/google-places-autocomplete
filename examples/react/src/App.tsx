import { useState } from 'react'
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-react'
import { DEMO_CONFIG, getDemoApiKey } from '../../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
} from '@anil-labs/google-places-autocomplete-core'

const apiKey = getDemoApiKey()

export function App() {
  const [selected, setSelected] = useState<PlaceDetails | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  return (
    <main className="demo">
      <h1>@anil-labs/google-places-autocomplete — React</h1>
      <p className="tag">
        Type an address below. Selecting a suggestion resolves the full place via the same session.
      </p>
      <PlacesAutocomplete
        apiKey={apiKey}
        debounceMs={DEMO_CONFIG.debounceMs}
        minLength={DEMO_CONFIG.minLength}
        regionCode={DEMO_CONFIG.regionCode}
        languageCode={DEMO_CONFIG.languageCode}
        placeholder="Start typing an address…"
        onSelect={(place) => {
          setSelected(place)
          setErrorMessage(null)
        }}
        onError={(error: PlacesAutocompleteError) => setErrorMessage(error.message)}
      />
      {errorMessage && <p className="error">{errorMessage}</p>}
      {selected && <pre>{JSON.stringify(selected, null, 2)}</pre>}
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
