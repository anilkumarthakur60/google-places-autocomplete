import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { PlacesAutocomplete } from '../src/PlacesAutocomplete'
import type { Fetcher } from '@anil-labs/google-places-autocomplete-core'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

function suggestionsBody(entries: Array<{ id: string; main: string }>) {
  return {
    suggestions: entries.map((e) => ({
      placePrediction: {
        placeId: e.id,
        text: { text: e.main },
        structuredFormat: { mainText: { text: e.main } },
        types: [],
      },
    })),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('PlacesAutocomplete (Solid)', () => {
  it('renders a combobox input', () => {
    render(() => <PlacesAutocomplete apiKey="k" />)
    expect(screen.getByRole('combobox')).toBeTruthy()
  })

  it('shows a loading indicator while a search is in flight', async () => {
    const fetcher = vi.fn<Fetcher>().mockImplementation(() => new Promise(() => {}))
    render(() => <PlacesAutocomplete apiKey="k" fetcher={fetcher} debounceMs={0} />)

    fireEvent.input(screen.getByRole('combobox'), { target: { value: '1600 amphi' } })
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getByText('Searching…')).toBeTruthy()
  })

  it('shows "No results found" when a search returns nothing', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse(suggestionsBody([])))
    render(() => <PlacesAutocomplete apiKey="k" fetcher={fetcher} debounceMs={0} />)

    fireEvent.input(screen.getByRole('combobox'), { target: { value: 'nowhere' } })
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getByText('No results found')).toBeTruthy()
  })

  it('closes the panel on an outside click', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    render(() => <PlacesAutocomplete apiKey="k" fetcher={fetcher} debounceMs={0} />)

    fireEvent.input(screen.getByRole('combobox'), { target: { value: 'a' } })
    await vi.advanceTimersByTimeAsync(0)
    expect(screen.getByRole('listbox')).toBeTruthy()

    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
