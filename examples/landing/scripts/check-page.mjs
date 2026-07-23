// Post-build guard against the ACTUAL built artifact — the deployed page, not
// source. A broken landing fails silently: the markup renders and only the
// autocomplete fields — the point of the page — come up dead. Typechecking
// can't catch a renamed id, an element never mounted, or a listener on the
// wrong node. So this mounts the real bundle in jsdom (the repo's test DOM),
// lets it run, and asserts every demo field mounts and the controls react.
//
// A live search needs a Google key + network, which this can't have, so it does
// NOT drive a real query; it verifies structure and interactivity. Accepts an
// optional dir arg so build-demos.mjs can point it at the assembled dist-demo/.
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

const distDir = process.argv[2] ?? fileURLToPath(new URL('../dist', import.meta.url))
const html = readFileSync(join(distDir, 'index.html'), 'utf-8')

const failures = []
const check = (condition, msg) => {
  if (!condition) failures.push(msg)
}
const tick = () => new Promise((r) => setTimeout(r, 0))

const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true })
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'customElements',
  'CustomEvent',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'MutationObserver',
  'Node',
  'getComputedStyle',
]) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key] ?? dom.window,
    configurable: true,
    writable: true,
  })
}
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
})

const scriptMatch = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/)
if (!scriptMatch) {
  console.error('✗ check-page (landing): no <script type="module"> in built index.html')
  process.exit(1)
}
await import(pathToFileURL(join(distDir, scriptMatch[1].replace(/^\/+/, ''))).href)
await tick()

const doc = dom.window.document
const $ = (sel) => doc.querySelector(sel)
const $$ = (sel) => [...doc.querySelectorAll(sel)]
const click = (elem) => elem?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))

// ---- framework links (static grid) ----
for (const href of ['/vue/', '/react/', '/svelte/', '/solid/', '/element/']) {
  check($(`#framework-grid a[href="${href}"]`) != null, `missing framework link ${href}.`)
}

// ---- every demo field mounted (the element upgraded and rendered an input) ----
for (const id of ['hero-demo', 'demo-uk', 'demo-fr', 'demo-instant', 'accent-demo']) {
  const input = $(`#${id} input.gpa-input`)
  check(input != null, `#${id}: no input.gpa-input — the element never mounted.`)
  if (input) {
    check(input.getAttribute('role') === 'combobox', `#${id}: input is missing role="combobox".`)
  }
}
check(
  $$('gpa-autocomplete').length >= 5,
  `expected 5+ autocomplete elements, found ${$$('gpa-autocomplete').length}.`,
)

// ---- version + key notice ----
check(/^v\d/.test($('#version-badge')?.textContent ?? ''), '#version-badge: version not injected.')
// The banner element must exist; its visibility depends on whether a key was
// baked into this build, so we don't assert hidden/shown here.
check($('#key-banner') != null, '#key-banner: the API-key notice is missing.')

// ---- theme toggle ----
click($('#theme-switch button[data-theme="light"]'))
await tick()
check(
  $('#page')?.getAttribute('data-theme') === 'light',
  'theme toggle: data-theme did not switch to light.',
)
check(
  $('#theme-switch button[data-theme="light"]')?.getAttribute('aria-pressed') === 'true',
  'theme toggle: aria-pressed did not move to the active button.',
)

// ---- accent picker ----
click($('#accent-switch button[data-accent="emerald"]'))
await tick()
check(
  $('#accent-demo gpa-autocomplete')?.style.getPropertyValue('--gpa-accent') === '#10b981',
  'accent picker: --gpa-accent was not applied to the demo element.',
)
check(
  ($('#accent-code')?.textContent ?? '').includes('#10b981'),
  'accent picker: the code sample did not update.',
)

// ---- report ----
if (failures.length > 0) {
  console.error(`\n✗ check-page (landing): ${failures.length} problem(s) in ${distDir}\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('✓ check-page (landing): all demos mount, theme + accent react, links present')
