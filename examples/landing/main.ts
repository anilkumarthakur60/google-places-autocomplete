// No CSS import needed — the element self-injects its stylesheet on connect;
// the page chrome is linked as ./styles.css from index.html.
import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'
import {
  DEMO_CONFIG,
  getDemoApiKey,
  getEnvApiKey,
  getStoredApiKey,
  setStoredApiKey,
} from '../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

defineGooglePlacesAutocompleteElement('gpa-autocomplete')

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Landing page markup is missing #${id}`)
  return node as T
}

// ------------------------------------------------------------------ chrome

el('version-badge').textContent = `v${__PKG_VERSION__}`

// --- Install copy ----------------------------------------------------------

const copyBtn = el<HTMLButtonElement>('install-copy')
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(el('install-cmd').textContent ?? '')
    copyBtn.textContent = 'Copied'
  } catch {
    copyBtn.textContent = 'Copy failed'
  }
  setTimeout(() => {
    copyBtn.textContent = 'Copy'
  }, 1400)
})

// --- Theme -----------------------------------------------------------------

type Theme = 'light' | 'dark' | 'auto'

const page = el('page')
const themeSwitch = el('theme-switch')

function applyTheme(theme: Theme): void {
  // The element follows this via the `.page[data-theme] .gpa-root` overrides in
  // styles.css — no per-instance work needed.
  page.dataset.theme = theme
  themeSwitch.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === theme))
  })
  themeSwitch.dataset.active = theme
}

themeSwitch.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-theme]')
  if (button) applyTheme(button.dataset.theme as Theme)
})

// ------------------------------------------------------------------- demos
//
// Config attributes on <gpa-autocomplete> are read once, at first connection
// — the element's documented contract is "change config by recreating the
// element". The visitor can swap in their own API key at runtime (below), so
// every demo is described as a spec and mounted through remountAll(): saving
// a key tears the elements down and recreates them with the new one.

let apiKey = getDemoApiKey()

interface DemoSpec {
  container: string
  attrs: Record<string, string>
  /** Re-attached on every (re)mount — listeners die with the old element. */
  wire?: (node: HTMLElement) => void
}

const heroStatus = el('hero-status')
const heroOutput = el<HTMLPreElement>('hero-output')

const ACCENTS = {
  blue: '#2563eb',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
} as const

type AccentName = keyof typeof ACCENTS

let currentAccent: AccentName = 'blue'

const DEMOS: DemoSpec[] = [
  {
    container: 'hero-demo',
    attrs: {
      placeholder: 'Start typing an address…',
      'debounce-ms': String(DEMO_CONFIG.debounceMs),
      'min-length': String(DEMO_CONFIG.minLength),
      'region-code': DEMO_CONFIG.regionCode,
      'language-code': DEMO_CONFIG.languageCode,
    },
    wire: (node) => {
      node.addEventListener('select', (event) => {
        const { place } = (event as CustomEvent<{ place: PlaceDetails; suggestion: Suggestion }>)
          .detail
        heroOutput.hidden = false
        heroOutput.textContent = JSON.stringify(place, null, 2)
        heroStatus.textContent = `Resolved: ${place.formattedAddress ?? '(no formatted address)'}`
      })
      node.addEventListener('gpaerror', (event) => {
        const { error } = (event as CustomEvent<{ error: PlacesAutocompleteError }>).detail
        heroStatus.textContent = `Error: ${error.message}`
      })
    },
  },
  {
    container: 'demo-uk',
    attrs: { placeholder: 'e.g. 10 Downing Street', 'region-code': 'gb', 'language-code': 'en' },
  },
  {
    container: 'demo-fr',
    attrs: { placeholder: 'ex. 55 rue du Faubourg', 'region-code': 'fr', 'language-code': 'fr' },
  },
  {
    container: 'demo-instant',
    attrs: { placeholder: 'Type a single letter…', 'debounce-ms': '0', 'min-length': '1' },
  },
  {
    container: 'accent-demo',
    attrs: { placeholder: 'Focus me to see the accent…' },
    wire: (node) => {
      // A fresh element loses the inline accent — restore the active one.
      node.style.setProperty('--gpa-accent', ACCENTS[currentAccent])
    },
  },
]

/**
 * Attributes are set BEFORE the element is connected: customElements.define()
 * upgrades an already-connected element synchronously, so a later
 * setAttribute would race the controller's first read.
 */
function mountAll(): void {
  for (const spec of DEMOS) {
    const node = document.createElement('gpa-autocomplete')
    node.setAttribute('api-key', apiKey)
    for (const [name, value] of Object.entries(spec.attrs)) node.setAttribute(name, value)
    spec.wire?.(node)
    // replaceChildren drops any previous instance (disconnectedCallback
    // destroys its controller), making this safe to call repeatedly.
    el(spec.container).replaceChildren(node)
  }
}

mountAll()

// ----------------------------------------------------- bring-your-own key

const keyForm = el<HTMLFormElement>('api-key-form')
const keyInput = el<HTMLInputElement>('api-key-input')
const keyStatus = el('api-key-status')

function describeKeySource(): string {
  const stored = getStoredApiKey()
  if (stored) return `Using your key (…${stored.slice(-4)}) — stored in this browser.`
  if (getEnvApiKey()) return 'Using the key this build was made with.'
  return 'No key yet — the demos render, but Google returns no suggestions until you add one.'
}

function applyKey(next: string): void {
  setStoredApiKey(next)
  apiKey = getDemoApiKey()
  // Recreate every demo element with the new key — the element's documented
  // way to change config (attributes are read once, at first connection).
  mountAll()
  keyStatus.textContent = describeKeySource()
}

keyForm.addEventListener('submit', (event) => {
  event.preventDefault()
  applyKey(keyInput.value.trim())
})

el<HTMLButtonElement>('api-key-clear').addEventListener('click', () => {
  keyInput.value = ''
  applyKey('')
})

keyInput.value = getStoredApiKey()
keyStatus.textContent = describeKeySource()

// ----------------------------------------------------------------- theming

const accentSwitch = el('accent-switch')
const accentCode = el('accent-code')

function applyAccent(name: AccentName): void {
  currentAccent = name
  const value = ACCENTS[name]
  // Query live — the demo element is recreated whenever the API key changes.
  const node = document.querySelector<HTMLElement>('#accent-demo gpa-autocomplete')
  // Inline on the element (which carries .gpa-root) beats the stylesheet's own
  // `.gpa-root { --gpa-accent }`. The focus ring and active option use it.
  node?.style.setProperty('--gpa-accent', value)
  accentCode.textContent = `.gpa-root {\n  --gpa-accent: ${value};\n}`
  accentSwitch.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.accent === name))
  })
}

accentSwitch.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-accent]')
  if (button) applyAccent(button.dataset.accent as AccentName)
})

applyAccent('blue')
