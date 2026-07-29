import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineGooglePlacesAutocompleteElement } from '../src/GooglePlacesAutocompleteElement'
import type { Fetcher } from '@anil-labs/google-places-autocomplete-core'

const TAG = 'gpa-autocomplete-test'
defineGooglePlacesAutocompleteElement(TAG)

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

function createElement(fetcher?: Fetcher): HTMLElement {
  const el = document.createElement(TAG)
  el.setAttribute('api-key', 'k')
  el.setAttribute('debounce-ms', '0')
  if (fetcher) (el as unknown as { fetcher?: Fetcher }).fetcher = fetcher
  return el
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('GooglePlacesAutocompleteElement', () => {
  it('renders a combobox input', () => {
    document.body.append(createElement())
    const input = document.querySelector(`${TAG} input`)
    expect(input?.getAttribute('role')).toBe('combobox')
  })

  it('shows a loading indicator while a search is in flight', async () => {
    const fetcher = vi.fn<Fetcher>().mockImplementation(() => new Promise(() => {}))
    document.body.append(createElement(fetcher))

    const input = document.querySelector<HTMLInputElement>(`${TAG} input`)!
    input.value = '1600 amphi'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)

    expect(document.querySelector(`${TAG} .gpa-status`)?.textContent).toBe('Searching…')
  })

  it('shows "No results found" when a search returns nothing', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse(suggestionsBody([])))
    document.body.append(createElement(fetcher))

    const input = document.querySelector<HTMLInputElement>(`${TAG} input`)!
    input.value = 'nowhere'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)

    expect(document.querySelector(`${TAG} .gpa-empty`)?.textContent).toBe('No results found')
  })

  it('closes the panel on an outside click', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    document.body.append(createElement(fetcher))

    const input = document.querySelector<HTMLInputElement>(`${TAG} input`)!
    input.value = 'a'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector<HTMLElement>(`${TAG} .gpa-panel`)?.hidden).toBe(false)

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(document.querySelector<HTMLElement>(`${TAG} .gpa-panel`)?.hidden).toBe(true)
  })

  it('applies a changed api-key attribute to the next request (live attributes)', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    const el = createElement(fetcher)
    document.body.append(el)

    el.setAttribute('api-key', 'rotated-key')

    const input = document.querySelector<HTMLInputElement>(`${TAG} input`)!
    input.value = 'kathmandu'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [, init] = fetcher.mock.calls[0]!
    expect((init?.headers as Record<string, string>)['X-Goog-Api-Key']).toBe('rotated-key')
  })

  it('renders custom option content through renderOption', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'Main St' }])))
    const el = createElement(fetcher)
    ;(
      el as unknown as { renderOption?: (s: { mainText: string }, active: boolean) => string }
    ).renderOption = (s) => `custom: ${s.mainText}`
    document.body.append(el)

    const input = document.querySelector<HTMLInputElement>(`${TAG} input`)!
    input.value = 'main'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    const option = document.querySelector(`${TAG} .gpa-option`)
    expect(option?.textContent).toBe('custom: Main St')
  })

  it('uses searching-text and no-results-text labels', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse({ suggestions: [] }))
    const el = createElement(fetcher)
    el.setAttribute('searching-text', 'Khojdai…')
    el.setAttribute('no-results-text', 'Kehi bhetiyena')
    document.body.append(el)

    const input = document.querySelector<HTMLInputElement>(`${TAG} input`)!
    input.value = 'zzz'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(document.querySelector(`${TAG} .gpa-empty`)?.textContent).toBe('Kehi bhetiyena')
  })
})
