// @vitest-environment node
//
// Regression guard: this file runs under plain Node (no jsdom), i.e. no
// `HTMLElement`/`customElements` globals — exactly what an SSR pass in
// Next.js/Nuxt/SvelteKit looks like. Merely importing the module must not
// throw (see the SSR-safety note in GooglePlacesAutocompleteElement.ts).
import { describe, expect, it } from 'vitest'

describe('SSR safety', () => {
  it('can be imported without HTMLElement/customElements defined', async () => {
    await expect(import('../src/GooglePlacesAutocompleteElement')).resolves.toBeTruthy()
  })

  it('defineGooglePlacesAutocompleteElement no-ops instead of throwing', async () => {
    const { defineGooglePlacesAutocompleteElement } =
      await import('../src/GooglePlacesAutocompleteElement')
    expect(() => defineGooglePlacesAutocompleteElement('gpa-ssr-test')).not.toThrow()
  })
})
