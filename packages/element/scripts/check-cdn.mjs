// Post-build smoke test for the standalone CDN (IIFE) bundle.
//
// Loads dist/index.global.js exactly as a browser would from a <script> tag,
// then asserts the drop-in contract holds without any manual setup:
//   1. it auto-registers the default <gpa-autocomplete> tag,
//   2. it exposes the named API on the `GooglePlacesAutocomplete` global,
//   3. an element mounts, renders the combobox input, and self-injects styles.
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'

const bundle = readFileSync(new URL('../dist/index.global.js', import.meta.url), 'utf8')

const dom = new JSDOM('<!doctype html><body></body>', {
  url: 'http://localhost/',
  runScripts: 'dangerously',
})

// Real browsers (the CDN target) ship a global `fetch`; jsdom does not. Provide
// one so the element takes its zero-config default-fetch path on connect,
// exactly as it would from a real <script> tag. It never resolves — we only
// assert the drop-in contract (register/mount/style), not a live request.
dom.window.fetch = () => new Promise(() => {})

// Execute the bundle the way a <script> tag would.
const script = dom.window.document.createElement('script')
script.textContent = bundle
dom.window.document.body.append(script)

const { window } = dom

if (typeof window.customElements.get('gpa-autocomplete') !== 'function') {
  console.error('✗ check-cdn (element): the CDN bundle did not auto-register <gpa-autocomplete>')
  process.exit(1)
}

const api = window.GooglePlacesAutocomplete
if (!api || typeof api.defineGooglePlacesAutocompleteElement !== 'function') {
  console.error(
    '✗ check-cdn (element): expected the GooglePlacesAutocomplete global to expose define()',
  )
  process.exit(1)
}

const el = window.document.createElement('gpa-autocomplete')
el.setAttribute('api-key', 'test-key')
window.document.body.append(el)

const input = el.querySelector('input.gpa-input')
if (!input || input.getAttribute('role') !== 'combobox') {
  console.error(
    '✗ check-cdn (element): the auto-registered element did not render the combobox input',
  )
  process.exit(1)
}

const injected = window.document.getElementById('gpa-autocomplete-styles')
if (!injected || !injected.textContent.includes('.gpa-input')) {
  console.error('✗ check-cdn (element): the CDN bundle did not self-inject the stylesheet')
  process.exit(1)
}

console.log(
  '✓ check-cdn (element): script-tag bundle auto-registers, exposes the global, mounts and self-styles',
)
