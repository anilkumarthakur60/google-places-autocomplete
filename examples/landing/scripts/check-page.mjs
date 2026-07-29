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
// The BYO-key feature persists the visitor's key here; Node itself may not
// provide a global localStorage, so register jsdom's.
Object.defineProperty(globalThis, 'localStorage', {
  value: dom.window.localStorage,
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

// ---- version ----
check(/^v\d/.test($('#version-badge')?.textContent ?? ''), '#version-badge: version not injected.')

// ---- bring-your-own API key ----
// The whole point of the panel: a visitor pastes THEIR key and every demo on
// the page is recreated with it. Drive the real flow: type → submit → assert
// the attribute landed on every element, the key persisted, and the remounted
// elements still upgraded. Then clear and assert the reverse.
const keyInput = $('#api-key-input')
const keyForm = $('#api-key-form')
check(keyInput != null, '#api-key-input: the key input is missing.')
check(keyForm != null, '#api-key-form: the key form is missing.')
check($('#api-key-save') != null, '#api-key-save: the save button is missing.')
check($('#api-key-clear') != null, '#api-key-clear: the clear button is missing.')
check(
  ($('#api-key-status')?.textContent ?? '').trim().length > 0,
  '#api-key-status: no initial key-source status is shown.',
)

if (keyInput && keyForm) {
  keyInput.value = 'test-key-123'
  keyForm.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  await tick()

  const elements = $$('gpa-autocomplete')
  check(
    elements.length >= 5 && elements.every((n) => n.getAttribute('api-key') === 'test-key-123'),
    'BYO key: saving did not apply the key to every demo element.',
  )
  check(
    dom.window.localStorage.getItem('gpa-demo-api-key') === 'test-key-123',
    'BYO key: the key was not persisted to localStorage.',
  )
  for (const id of ['hero-demo', 'demo-uk', 'demo-fr', 'demo-instant', 'accent-demo']) {
    check(
      $(`#${id} input.gpa-input`) != null,
      `#${id}: element did not re-mount after the key was applied.`,
    )
  }
  check(
    ($('#api-key-status')?.textContent ?? '').includes('-123'),
    '#api-key-status: status does not reflect the saved key.',
  )

  click($('#api-key-clear'))
  await tick()
  check(
    dom.window.localStorage.getItem('gpa-demo-api-key') === null,
    'BYO key: clearing did not remove the stored key.',
  )
  check(
    $$('gpa-autocomplete').every((n) => (n.getAttribute('api-key') ?? '') !== 'test-key-123'),
    'BYO key: clearing did not remove the key from the demo elements.',
  )
}

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
