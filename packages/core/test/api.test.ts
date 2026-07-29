import { describe, expect, it, vi } from 'vitest'
import { fetchAutocompleteSuggestions, fetchPlaceDetails } from '../src/api'
import { PlacesAutocompleteError } from '../src/types'
import type { Fetcher } from '../src/types'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('fetchAutocompleteSuggestions', () => {
  it('sends the correct request shape and maps the response', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(
      jsonResponse({
        suggestions: [
          {
            placePrediction: {
              placeId: 'place-1',
              text: { text: '1600 Amphitheatre Pkwy, Mountain View, CA' },
              structuredFormat: {
                mainText: { text: '1600 Amphitheatre Pkwy' },
                secondaryText: { text: 'Mountain View, CA' },
              },
              types: ['street_address'],
            },
          },
          // An entry with no placePrediction should be dropped, not throw.
          {},
        ],
      }),
    )

    const suggestions = await fetchAutocompleteSuggestions({
      input: '1600 amphi',
      sessionToken: 'session-1',
      apiKey: 'test-key',
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0]!
    expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete')
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>)['X-Goog-Api-Key']).toBe('test-key')
    expect(JSON.parse(init?.body as string)).toMatchObject({
      input: '1600 amphi',
      sessionToken: 'session-1',
    })

    expect(suggestions).toEqual([
      {
        placeId: 'place-1',
        text: '1600 Amphitheatre Pkwy, Mountain View, CA',
        mainText: '1600 Amphitheatre Pkwy',
        secondaryText: 'Mountain View, CA',
        types: ['street_address'],
        textMatches: [],
        mainTextMatches: [],
        raw: expect.objectContaining({ placeId: 'place-1' }),
      },
    ])
  })

  it('throws PlacesAutocompleteError with the status on a non-ok response', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse({}, 403))

    await expect(
      fetchAutocompleteSuggestions({
        input: 'x',
        sessionToken: 's',
        apiKey: 'k',
        fetcher,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('passes type filters, restriction and origin through, and maps distance + matches', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(
      jsonResponse({
        suggestions: [
          {
            placePrediction: {
              placeId: 'p1',
              // Google omits zero-valued startOffset; it must normalize to 0.
              text: { text: 'Paris, France', matches: [{ endOffset: 5 }] },
              structuredFormat: {
                mainText: { text: 'Paris', matches: [{ startOffset: 0, endOffset: 5 }] },
                secondaryText: { text: 'France' },
              },
              types: ['locality'],
              distanceMeters: 4200,
            },
          },
        ],
      }),
    )

    const suggestions = await fetchAutocompleteSuggestions({
      input: 'par',
      sessionToken: 's',
      apiKey: 'k',
      fetcher,
      includedPrimaryTypes: ['locality'],
      locationRestriction: {
        rectangle: { low: { latitude: 40, longitude: -5 }, high: { latitude: 52, longitude: 9 } },
      },
      origin: { latitude: 48.8, longitude: 2.3 },
    })

    const [, init] = fetcher.mock.calls[0]!
    const body = JSON.parse(init?.body as string)
    expect(body.includedPrimaryTypes).toEqual(['locality'])
    expect(body.locationRestriction).toEqual({
      rectangle: { low: { latitude: 40, longitude: -5 }, high: { latitude: 52, longitude: 9 } },
    })
    expect(body.origin).toEqual({ latitude: 48.8, longitude: 2.3 })
    expect((init?.headers as Record<string, string>)['X-Goog-FieldMask']).toContain(
      'suggestions.placePrediction.distanceMeters',
    )

    expect(suggestions[0]).toMatchObject({
      distanceMeters: 4200,
      textMatches: [{ startOffset: 0, endOffset: 5 }],
      mainTextMatches: [{ startOffset: 0, endOffset: 5 }],
    })
  })

  it('falls back mainTextMatches to text matches when structuredFormat is absent', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(
      jsonResponse({
        suggestions: [
          {
            placePrediction: {
              placeId: 'p1',
              text: { text: 'Berlin', matches: [{ endOffset: 3 }] },
            },
          },
        ],
      }),
    )

    const [suggestion] = await fetchAutocompleteSuggestions({
      input: 'ber',
      sessionToken: 's',
      apiKey: 'k',
      fetcher,
    })

    // mainText fell back to `text`, so its matches must fall back too.
    expect(suggestion!.mainText).toBe('Berlin')
    expect(suggestion!.mainTextMatches).toEqual([{ startOffset: 0, endOffset: 3 }])
  })
})

describe('fetchPlaceDetails', () => {
  it('sends the field mask and session token, and maps the response', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(
      jsonResponse({
        id: 'place-1',
        displayName: { text: 'Googleplex' },
        formattedAddress: '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
        location: { latitude: 37.422, longitude: -122.084 },
        addressComponents: [
          { longText: 'Mountain View', shortText: 'Mountain View', types: ['locality'] },
        ],
      }),
    )

    const details = await fetchPlaceDetails({
      placeId: 'place-1',
      sessionToken: 'session-1',
      apiKey: 'test-key',
      fetcher,
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'],
    })

    const [url, init] = fetcher.mock.calls[0]!
    expect(String(url)).toBe(
      'https://places.googleapis.com/v1/places/place-1?sessionToken=session-1',
    )
    expect((init?.headers as Record<string, string>)['X-Goog-FieldMask']).toBe(
      'id,displayName,formattedAddress,location,addressComponents',
    )

    expect(details).toEqual({
      placeId: 'place-1',
      displayName: 'Googleplex',
      formattedAddress: '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
      location: { lat: 37.422, lng: -122.084 },
      addressComponents: [
        { longText: 'Mountain View', shortText: 'Mountain View', types: ['locality'] },
      ],
      raw: expect.objectContaining({ id: 'place-1' }),
    })
  })

  it('localizes the details request when languageCode/regionCode are set', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse({ id: 'p1' }))

    await fetchPlaceDetails({
      placeId: 'p1',
      sessionToken: 's',
      apiKey: 'k',
      fetcher,
      fields: ['id'],
      languageCode: 'fr',
      regionCode: 'fr',
    })

    const [url] = fetcher.mock.calls[0]!
    const parsed = new URL(String(url))
    expect(parsed.searchParams.get('languageCode')).toBe('fr')
    expect(parsed.searchParams.get('regionCode')).toBe('fr')
  })

  it('rejects with PlacesAutocompleteError on failure', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse({}, 404))

    await expect(
      fetchPlaceDetails({
        placeId: 'missing',
        sessionToken: 's',
        apiKey: 'k',
        fetcher,
        fields: ['id'],
      }),
    ).rejects.toBeInstanceOf(PlacesAutocompleteError)
  })
})
