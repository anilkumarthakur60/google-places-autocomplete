/**
 * Binds a listener that calls `onOutside` whenever a pointer press lands
 * outside `root`, and returns a cleanup function.
 *
 * DOM-only — call it from a mount/effect hook in your wrapper, never at
 * module scope, so merely importing this file doesn't break environments
 * without `document` (SSR, plain unit tests of the headless machine).
 *
 * Uses the capture phase so it observes the press before a same-tick click
 * handler (e.g. selecting a suggestion) could reopen or otherwise mutate the
 * panel — that handler runs on `mousedown`/`pointerdown` inside `root`, which
 * `root.contains(target)` still correctly treats as "inside."
 */
export function bindOutsideClose(root: Element, onOutside: () => void): () => void {
  function handlePointerDown(event: PointerEvent): void {
    const target = event.target as Node | null
    if (target && !root.contains(target)) onOutside()
  }

  document.addEventListener('pointerdown', handlePointerDown, true)
  return () => document.removeEventListener('pointerdown', handlePointerDown, true)
}
