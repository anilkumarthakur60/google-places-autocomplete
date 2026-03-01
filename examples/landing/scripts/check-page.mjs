// Post-build smoke test against the ACTUAL built artifact — the deployed
// page, not source. Verifies both halves of the landing page: the static
// framework-link grid, and the live web-component demo actually mounting
// and rendering. Accepts an optional directory argument so build-demos.mjs
// can point it at the assembled dist-demo/ (this package's own `build`
// script runs it with no argument, against its own local dist/).
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

const distDir = process.argv[2] ?? fileURLToPath(new URL('../dist', import.meta.url))
const htmlPath = join(distDir, 'index.html')
const html = readFileSync(htmlPath, 'utf-8')

const EXPECTED_FRAMEWORK_LINKS = ['/vue/', '/react/', '/svelte/', '/solid/', '/element/']
const missingLinks = EXPECTED_FRAMEWORK_LINKS.filter((href) => !html.includes(`href="${href}"`))
if (missingLinks.length > 0) {
  console.error(
    `✗ check-page (landing): missing framework link(s) in built HTML: ${missingLinks.join(', ')}`,
  )
  process.exit(1)
}

const dom = new JSDOM(html, { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.customElements = dom.window.customElements
globalThis.CustomEvent = dom.window.CustomEvent
globalThis.Event = dom.window.Event
globalThis.KeyboardEvent = dom.window.KeyboardEvent
// Vite's modulepreload polyfill (auto-injected at the top of the built
// bundle) uses these.
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.Node = dom.window.Node

// jsdom doesn't reliably execute <script type="module"> itself; resolve and
// import the real emitted entry file directly instead.
const scriptMatch = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/)
if (!scriptMatch) {
  console.error('✗ check-page (landing): no <script type="module"> found in built index.html')
  process.exit(1)
}
const scriptPath = join(distDir, scriptMatch[1].replace(/^\/+/, ''))
await import(pathToFileURL(scriptPath).href)

const container = document.getElementById('autocomplete-container')
const input = container?.querySelector('input.gpa-input')

if (!input) {
  console.error('✗ check-page (landing): expected input.gpa-input inside #autocomplete-container')
  process.exit(1)
}
if (input.getAttribute('role') !== 'combobox') {
  console.error('✗ check-page (landing): input is missing role="combobox"')
  process.exit(1)
}

console.log(
  '✓ check-page (landing): framework links present, built page mounts and renders the demo',
)
