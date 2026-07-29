// Post-build smoke test: registers and mounts the ACTUAL dist/index.js
// bundle (not src/) under jsdom — the same guard used by every other
// wrapper package.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.customElements = dom.window.customElements
globalThis.CustomEvent = dom.window.CustomEvent
globalThis.Event = dom.window.Event
globalThis.KeyboardEvent = dom.window.KeyboardEvent

const { defineGooglePlacesAutocompleteElement } = await import('../dist/index.js')
defineGooglePlacesAutocompleteElement('gpa-autocomplete-check')

const el = document.createElement('gpa-autocomplete-check')
el.setAttribute('api-key', 'test-key')
document.getElementById('app').append(el)

const input = el.querySelector('input.gpa-input')
if (!input) {
  console.error(
    '✗ check-dist (element): expected input.gpa-input to be rendered by the built bundle',
  )
  process.exit(1)
}
if (input.getAttribute('role') !== 'combobox') {
  console.error('✗ check-dist (element): input is missing role="combobox"')
  process.exit(1)
}

// The library build must inline + self-inject the stylesheet (no separate CSS
// import), so a <style id="gpa-autocomplete-styles"> should now be in <head>.
const injected = document.getElementById('gpa-autocomplete-styles')
if (!injected || !injected.textContent.includes('.gpa-input')) {
  console.error('✗ check-dist (element): expected the bundle to self-inject the core stylesheet')
  process.exit(1)
}

console.log(
  '✓ check-dist (element): built bundle registers, mounts, renders, and self-injects styles',
)
