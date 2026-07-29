import { PlacesAutocompleteError } from './types'
import type {
  AddressComponent,
  Fetcher,
  LatLng,
  LocationBias,
  LocationRestriction,
  PlaceDetails,
  Suggestion,
  SuggestionMatch,
} from './types'

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const PLACE_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places'

// Only the fields this module actually reads — Google's real responses carry
// much more, and `unknown`-typing the rest keeps us honest about that.
interface RawMatch {
  startOffset?: number
  endOffset?: number
}

interface RawLocalizedText {
  text?: string
  matches?: RawMatch[]
}

interface RawAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string
      text?: RawLocalizedText
      structuredFormat?: {
        mainText?: RawLocalizedText
        secondaryText?: RawLocalizedText
      }
      types?: string[]
      distanceMeters?: number
    }
  }>
}

// Google omits zero-valued offsets from the JSON; normalize them back.
function mapMatches(matches: RawMatch[] | undefined): SuggestionMatch[] {
  return (matches ?? []).map((m) => ({
    startOffset: m.startOffset ?? 0,
    endOffset: m.endOffset ?? 0,
  }))
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
  includedPrimaryTypes?: string[]
  locationBias?: LocationBias
  locationRestriction?: LocationRestriction
  origin?: LatLng
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
  if (params.includedPrimaryTypes?.length) body.includedPrimaryTypes = params.includedPrimaryTypes
  if (params.locationBias) body.locationBias = params.locationBias
  if (params.locationRestriction) body.locationRestriction = params.locationRestriction
  if (params.origin) body.origin = params.origin

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': params.apiKey,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types,suggestions.placePrediction.distanceMeters',
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
    const suggestion: Suggestion = {
      placeId: prediction.placeId,
      text,
      mainText: prediction.structuredFormat?.mainText?.text ?? text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
      types: prediction.types ?? [],
      textMatches: mapMatches(prediction.text?.matches),
      // When there is no structuredFormat, mainText falls back to `text` —
      // so its match ranges must fall back with it or highlights misalign.
      mainTextMatches: prediction.structuredFormat?.mainText
        ? mapMatches(prediction.structuredFormat.mainText.matches)
        : mapMatches(prediction.text?.matches),
      raw: prediction,
    }
    if (prediction.distanceMeters !== undefined)
      suggestion.distanceMeters = prediction.distanceMeters
    return [suggestion]
  })
}

export interface FetchPlaceDetailsParams {
  placeId: string
  sessionToken: string
  apiKey: string
  fetcher: Fetcher
  fields: readonly string[]
  signal?: AbortSignal
  /** Localize the resolved details the same way the suggestions were. */
  languageCode?: string
  regionCode?: string
}

export async function fetchPlaceDetails(params: FetchPlaceDetailsParams): Promise<PlaceDetails> {
  const url = new URL(`${PLACE_DETAILS_BASE_URL}/${params.placeId}`)
  url.searchParams.set('sessionToken', params.sessionToken)
  if (params.languageCode) url.searchParams.set('languageCode', params.languageCode)
  if (params.regionCode) url.searchParams.set('regionCode', params.regionCode)

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
    raw: data,
  }
}
