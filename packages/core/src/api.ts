import { PlacesAutocompleteError } from './types'
import type { AddressComponent, Fetcher, LocationBias, PlaceDetails, Suggestion } from './types'

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const PLACE_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places'

// Only the fields this module actually reads — Google's real responses carry
// much more, and `unknown`-typing the rest keeps us honest about that.
interface RawAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string
      text?: { text?: string }
      structuredFormat?: {
        mainText?: { text?: string }
        secondaryText?: { text?: string }
      }
      types?: string[]
    }
  }>
}

interface RawPlaceDetailsResponse {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>
}

export interface FetchAutocompleteSuggestionsParams {
  input: string
  sessionToken: string
  apiKey: string
  fetcher: Fetcher
  signal?: AbortSignal
  languageCode?: string
  regionCode?: string
  includedRegionCodes?: string[]
  locationBias?: LocationBias
}

export async function fetchAutocompleteSuggestions(
  params: FetchAutocompleteSuggestionsParams,
): Promise<Suggestion[]> {
  const body: Record<string, unknown> = {
    input: params.input,
    sessionToken: params.sessionToken,
  }
  if (params.languageCode) body.languageCode = params.languageCode
  if (params.regionCode) body.regionCode = params.regionCode
  if (params.includedRegionCodes?.length) body.includedRegionCodes = params.includedRegionCodes
  if (params.locationBias) body.locationBias = params.locationBias

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': params.apiKey,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types',
    },
    body: JSON.stringify(body),
  }
  if (params.signal) requestInit.signal = params.signal

  const response = await params.fetcher(AUTOCOMPLETE_URL, requestInit)

  if (!response.ok) {
    throw new PlacesAutocompleteError(`Places autocomplete request failed (${response.status})`, {
      status: response.status,
    })
  }

  const data = (await response.json()) as RawAutocompleteResponse
  return (data.suggestions ?? []).flatMap((entry): Suggestion[] => {
    const prediction = entry.placePrediction
    if (!prediction) return []
    const text = prediction.text?.text ?? ''
    return [
      {
        placeId: prediction.placeId,
        text,
        mainText: prediction.structuredFormat?.mainText?.text ?? text,
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
        types: prediction.types ?? [],
      },
    ]
  })
}

export interface FetchPlaceDetailsParams {
  placeId: string
  sessionToken: string
  apiKey: string
  fetcher: Fetcher
  fields: readonly string[]
  signal?: AbortSignal
}

export async function fetchPlaceDetails(params: FetchPlaceDetailsParams): Promise<PlaceDetails> {
  const url = new URL(`${PLACE_DETAILS_BASE_URL}/${params.placeId}`)
  url.searchParams.set('sessionToken', params.sessionToken)

  const requestInit: RequestInit = {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': params.apiKey,
      'X-Goog-FieldMask': params.fields.join(','),
    },
  }
  if (params.signal) requestInit.signal = params.signal

  const response = await params.fetcher(url, requestInit)

  if (!response.ok) {
    throw new PlacesAutocompleteError(`Place details request failed (${response.status})`, {
      status: response.status,
    })
  }

  const data = (await response.json()) as RawPlaceDetailsResponse
  const addressComponents: AddressComponent[] = (data.addressComponents ?? []).map((c) => ({
    longText: c.longText ?? '',
    shortText: c.shortText ?? '',
    types: c.types ?? [],
  }))

  return {
    placeId: data.id ?? params.placeId,
    displayName: data.displayName?.text ?? '',
    formattedAddress: data.formattedAddress ?? '',
    location: data.location ? { lat: data.location.latitude, lng: data.location.longitude } : null,
    addressComponents,
  }
}
