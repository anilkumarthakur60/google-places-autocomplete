import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import PlacesAutocomplete from '../src/PlacesAutocomplete.svelte'
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

let container: HTMLElement
let instance: object | undefined

function setInputValue(value: string): void {
  const input = container.querySelector('input')
  if (!input) throw new Error('input not found')
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(async () => {
  if (instance) await unmount(instance)
  instance = undefined
  container.remove()
  vi.useRealTimers()
})

describe('PlacesAutocomplete (Svelte)', () => {
  it('renders a combobox input', () => {
    instance = mount(PlacesAutocomplete, { target: container, props: { apiKey: 'k' } })
    const input = container.querySelector('input')
    expect(input?.getAttribute('role')).toBe('combobox')
  })

  it('shows a loading indicator while a search is in flight', async () => {
    const fetcher = vi.fn<Fetcher>().mockImplementation(() => new Promise(() => {}))
    instance = mount(PlacesAutocomplete, {
      target: container,
      props: { apiKey: 'k', fetcher, debounceMs: 0 },
    })

    setInputValue('1600 amphi')
    await vi.advanceTimersByTimeAsync(0)
    flushSync()

    expect(container.querySelector('.gpa-status')?.textContent).toBe('Searching…')
  })

  it('shows "No results found" when a search returns nothing', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse(suggestionsBody([])))
    instance = mount(PlacesAutocomplete, {
      target: container,
      props: { apiKey: 'k', fetcher, debounceMs: 0 },
    })

    setInputValue('nowhere')
    await vi.advanceTimersByTimeAsync(0)
    flushSync()

    expect(container.querySelector('.gpa-empty')?.textContent).toBe('No results found')
  })

  it('closes the panel on an outside click', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    instance = mount(PlacesAutocomplete, {
      target: container,
      props: { apiKey: 'k', fetcher, debounceMs: 0 },
    })

    setInputValue('a')
    await vi.advanceTimersByTimeAsync(0)
    flushSync()
    expect(container.querySelector('.gpa-panel')).toBeTruthy()

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('.gpa-panel')).toBeNull()
  })
})
