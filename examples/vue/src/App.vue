<script setup lang="ts">
import { ref } from 'vue'
import { PlacesAutocomplete } from '@anil-labs/google-places-autocomplete-vue'
import { getDemoApiKey, DEMO_CONFIG } from '../../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
} from '@anil-labs/google-places-autocomplete-core'

const apiKey = getDemoApiKey()
const query = ref('')
const selected = ref<PlaceDetails | null>(null)
const errorMessage = ref<string | null>(null)

function handleSelect(place: PlaceDetails): void {
  selected.value = place
  errorMessage.value = null
}

function handleError(error: PlacesAutocompleteError): void {
  errorMessage.value = error.message
}
</script>

<template>
  <main class="demo">
    <h1>@anil-labs/google-places-autocomplete — Vue</h1>
    <p class="tag">
      Type an address below. Selecting a suggestion resolves the full place via the same session.
    </p>
    <PlacesAutocomplete
      v-model="query"
      :api-key="apiKey"
      :debounce-ms="DEMO_CONFIG.debounceMs"
      :min-length="DEMO_CONFIG.minLength"
      :region-code="DEMO_CONFIG.regionCode"
      :language-code="DEMO_CONFIG.languageCode"
      placeholder="Start typing an address…"
      @select="handleSelect"
      @error="handleError"
    />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <pre v-if="selected">{{ JSON.stringify(selected, null, 2) }}</pre>
  </main>
</template>

<style>
body {
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
