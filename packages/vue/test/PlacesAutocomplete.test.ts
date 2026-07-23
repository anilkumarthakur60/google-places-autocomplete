import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
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
})

describe('PlacesAutocomplete (Vue)', () => {
  it('renders a combobox input', () => {
    const wrapper = mount(PlacesAutocomplete, { props: { apiKey: 'k' } })
    expect(wrapper.find('input').attributes('role')).toBe('combobox')
  })

  it('shows a loading indicator while a search is in flight', async () => {
    const fetcher = vi.fn<Fetcher>().mockImplementation(() => new Promise(() => {}))
    const wrapper = mount(PlacesAutocomplete, { props: { apiKey: 'k', fetcher, debounceMs: 0 } })

    await wrapper.find('input').setValue('1600 amphi')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.gpa-status').text()).toBe('Searching…')
  })

  it('shows "No results found" when a search returns nothing', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse(suggestionsBody([])))
    const wrapper = mount(PlacesAutocomplete, { props: { apiKey: 'k', fetcher, debounceMs: 0 } })

    await wrapper.find('input').setValue('nowhere')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.gpa-empty').text()).toBe('No results found')
  })

  it('closes the panel on an outside click', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    const wrapper = mount(PlacesAutocomplete, {
      props: { apiKey: 'k', fetcher, debounceMs: 0 },
      attachTo: document.body,
    })

    await wrapper.find('input').setValue('a')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gpa-panel').exists()).toBe(true)

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.gpa-panel').exists()).toBe(false)

    wrapper.unmount()
  })

  it('applies a changed apiKey prop to the next request without remounting', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'A' }])))
    const wrapper = mount(PlacesAutocomplete, {
      props: { apiKey: 'old-key', fetcher, debounceMs: 0 },
    })

    await wrapper.setProps({ apiKey: 'new-key' })

    await wrapper.find('input').setValue('kathmandu')
    await vi.advanceTimersByTimeAsync(0)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [, init] = fetcher.mock.calls[0]!
    expect((init?.headers as Record<string, string>)['X-Goog-Api-Key']).toBe('new-key')
    wrapper.unmount()
  })

  it('renders custom option content through the suggestion slot', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(jsonResponse(suggestionsBody([{ id: 'p1', main: 'Main St' }])))
    const wrapper = mount(PlacesAutocomplete, {
      props: { apiKey: 'k', fetcher, debounceMs: 0 },
      slots: {
        suggestion: ({ suggestion }: { suggestion: { mainText: string } }) =>
          h('em', `custom: ${suggestion.mainText}`),
      },
    })

    await wrapper.find('input').setValue('main')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    const custom = wrapper.find('.gpa-option em')
    expect(custom.exists()).toBe(true)
    expect(custom.text()).toBe('custom: Main St')
    wrapper.unmount()
  })

  it('uses labels for the empty state', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(jsonResponse({ suggestions: [] }))
    const wrapper = mount(PlacesAutocomplete, {
      props: { apiKey: 'k', fetcher, debounceMs: 0, labels: { noResults: 'Kehi bhetiyena' } },
    })

    await wrapper.find('input').setValue('zzz')
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(wrapper.find('.gpa-empty').text()).toBe('Kehi bhetiyena')
    wrapper.unmount()
  })
})
