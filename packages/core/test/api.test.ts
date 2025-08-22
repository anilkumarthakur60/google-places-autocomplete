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
    })
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
