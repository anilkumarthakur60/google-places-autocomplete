// No CSS import needed — the element self-injects its stylesheet on connect;
// the page chrome is linked as ./styles.css from index.html.
import { defineGooglePlacesAutocompleteElement } from '@anil-labs/google-places-autocomplete-element'
import { DEMO_CONFIG, getDemoApiKey } from '../shared/src/config'
import type {
  PlaceDetails,
  PlacesAutocompleteError,
  Suggestion,
} from '@anil-labs/google-places-autocomplete-core'

defineGooglePlacesAutocompleteElement('gpa-autocomplete')

const apiKey = getDemoApiKey()

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Landing page markup is missing #${id}`)
  return node as T
}

/**
 * Create a configured <gpa-autocomplete> and append it. Attributes are set
 * BEFORE the element is connected: customElements.define() upgrades an
 * already-connected element synchronously, so a later setAttribute would race
 * the controller's first read (see examples/element/src/main.ts).
 */
const mount = (containerId: string, attrs: Record<string, string>): HTMLElement => {
  const node = document.createElement('gpa-autocomplete')
  node.setAttribute('api-key', apiKey)
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  el(containerId).append(node)
  return node
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

// --- API-key notice --------------------------------------------------------

// The inputs are real either way; without a key Google just returns nothing,
// so say so rather than leave a silently-dead field.
if (!apiKey) el('key-banner').hidden = false

// ------------------------------------------------------------------- demos

// --- Hero: live autocomplete + resolved-details inspector ---
const heroStatus = el('hero-status')
const heroOutput = el<HTMLPreElement>('hero-output')
const hero = mount('hero-demo', {
  placeholder: 'Start typing an address…',
  'debounce-ms': String(DEMO_CONFIG.debounceMs),
  'min-length': String(DEMO_CONFIG.minLength),
  'region-code': DEMO_CONFIG.regionCode,
  'language-code': DEMO_CONFIG.languageCode,
})
hero.addEventListener('select', (event) => {
  const { place } = (event as CustomEvent<{ place: PlaceDetails; suggestion: Suggestion }>).detail
  heroOutput.hidden = false
  heroOutput.textContent = JSON.stringify(place, null, 2)
  heroStatus.textContent = `Resolved: ${place.formattedAddress ?? '(no formatted address)'}`
})
hero.addEventListener('gpaerror', (event) => {
  const { error } = (event as CustomEvent<{ error: PlacesAutocompleteError }>).detail
  heroStatus.textContent = `Error: ${error.message}`
})

// --- Config demos: same component, different attributes ---
mount('demo-uk', {
  placeholder: 'e.g. 10 Downing Street',
  'region-code': 'gb',
  'language-code': 'en',
})
mount('demo-fr', {
  placeholder: 'ex. 55 rue du Faubourg',
  'region-code': 'fr',
  'language-code': 'fr',
})
mount('demo-instant', {
  placeholder: 'Type a single letter…',
  'debounce-ms': '0',
  'min-length': '1',
})

// ----------------------------------------------------------------- theming

const ACCENTS = {
  blue: '#2563eb',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
} as const

type AccentName = keyof typeof ACCENTS

const accentNode = mount('accent-demo', { placeholder: 'Focus me to see the accent…' })
const accentSwitch = el('accent-switch')
const accentCode = el('accent-code')

function applyAccent(name: AccentName): void {
  const value = ACCENTS[name]
  // Inline on the element (which carries .gpa-root) beats the stylesheet's own
  // `.gpa-root { --gpa-accent }`. The focus ring and active option use it.
  accentNode.style.setProperty('--gpa-accent', value)
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
