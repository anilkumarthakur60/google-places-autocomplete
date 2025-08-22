import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPlacesAutocomplete } from '../src/machine'
import type { Fetcher } from '../src/types'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

function suggestionsBody(entries: Array<{ id: string; main: string; secondary?: string }>) {
  return {
    suggestions: entries.map((e) => ({
      placePrediction: {
        placeId: e.id,
        text: { text: e.secondary ? `${e.main}, ${e.secondary}` : e.main },
        structuredFormat: {
          mainText: { text: e.main },
          secondaryText: e.secondary ? { text: e.secondary } : undefined,
        },
        types: ['street_address'],
      },
    })),
  }
}

function placeDetailsBody(id: string, address: string) {
  return {
    id,
    displayName: { text: address },
    formattedAddress: address,
    location: { latitude: 1, longitude: 2 },
    addressComponents: [],
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createPlacesAutocomplete', () => {
  it('does not search below minLength and stays idle', async () => {
    const fetcher = vi.fn<Fetcher>()
    const machine = createPlacesAutocomplete({ apiKey: 'k', fetcher, minLength: 3 })

    machine.setQuery('ab')
    await vi.advanceTimersByTimeAsync(500)

    expect(fetcher).not.toHaveBeenCalled()
    expect(machine.getState().status).toBe('idle')
  })

  it('debounces, fetches suggestions, and opens the list', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(
        jsonResponse(suggestionsBody([{ id: 'p1', main: '1600 Amphitheatre Pkwy' }])),
      )
    const machine = createPlacesAutocomplete({ apiKey: 'k', fetcher, debounceMs: 200 })

    machine.setQuery('1600 amphi')
    expect(machine.getState().status).toBe('idle') // debounce hasn't fired yet

    await vi.advanceTimersByTimeAsync(200)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const state = machine.getState()
    expect(state.status).toBe('ready')
    expect(state.isOpen).toBe(true)
    expect(state.activeIndex).toBe(0)
    expect(state.suggestions).toHaveLength(1)
  })

  it('moveActive clamps within suggestion bounds', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(
      jsonResponse(
        suggestionsBody([
          { id: 'p1', main: 'A' },
          { id: 'p2', main: 'B' },
        ]),
      ),
    )
    const machine = createPlacesAutocomplete({ apiKey: 'k', fetcher, debounceMs: 0 })

    machine.setQuery('a')
    await vi.advanceTimersByTimeAsync(0)
    expect(machine.getState().activeIndex).toBe(0)

    machine.moveActive(-5)
    expect(machine.getState().activeIndex).toBe(0)

    machine.moveActive(1)
    expect(machine.getState().activeIndex).toBe(1)

    machine.moveActive(5)
    expect(machine.getState().activeIndex).toBe(1)
  })

  it('selectActive resolves place details via the same session token and calls onSelect', async () => {
    const suggestionsFetcher = vi
      .fn<Fetcher>()
      .mockResolvedValueOnce(
        jsonResponse(suggestionsBody([{ id: 'p1', main: '1600 Amphitheatre Pkwy' }])),
      )
      .mockResolvedValueOnce(
        jsonResponse(placeDetailsBody('p1', '1600 Amphitheatre Pkwy, Mountain View, CA 94043')),
      )
    const onSelect = vi.fn()
    const machine = createPlacesAutocomplete({
      apiKey: 'k',
      fetcher: suggestionsFetcher,
      debounceMs: 0,
      onSelect,
    })

    machine.setQuery('1600 amphi')
    await vi.advanceTimersByTimeAsync(0)
    machine.selectActive()
    await vi.advanceTimersByTimeAsync(0)

    const autocompleteSession = JSON.parse(suggestionsFetcher.mock.calls[0]![1]?.body as string)
      .sessionToken as string
    const detailsUrl = String(suggestionsFetcher.mock.calls[1]![0])
    expect(detailsUrl).toContain(`sessionToken=${autocompleteSession}`)

    const state = machine.getState()
    expect(state.selected?.formattedAddress).toBe('1600 Amphitheatre Pkwy, Mountain View, CA 94043')
    expect(state.isOpen).toBe(false)
    expect(state.suggestions).toHaveLength(0)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('a later query supersedes an earlier still-in-flight one', async () => {
    let resolveFirst: (value: Response) => void = () => {}
    const firstPromise = new Promise<Response>((resolve) => {
      resolveFirst = resolve
    })

    const fetcher = vi
      .fn<Fetcher>()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() =>
        Promise.resolve(jsonResponse(suggestionsBody([{ id: 'p2', main: 'Second result' }]))),
      )

    const machine = createPlacesAutocomplete({ apiKey: 'k', fetcher, debounceMs: 0 })

    machine.setQuery('first query')
    await vi.advanceTimersByTimeAsync(0)
    machine.setQuery('second query')
    await vi.advanceTimersByTimeAsync(0)

    // The stale first response arrives last; it must not clobber the newer state.
    resolveFirst(jsonResponse(suggestionsBody([{ id: 'p1', main: 'First result (stale)' }])))
    await Promise.resolve()
    await Promise.resolve()

    expect(machine.getState().suggestions).toEqual([
      expect.objectContaining({ placeId: 'p2', mainText: 'Second result' }),
    ])
  })

  it('destroy stops further state updates', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    const machine = createPlacesAutocomplete({ apiKey: 'k', fetcher, debounceMs: 0 })

    machine.setQuery('a')
    machine.destroy()
    await vi.advanceTimersByTimeAsync(50)

    expect(machine.getState().status).toBe('idle')
  })
})
