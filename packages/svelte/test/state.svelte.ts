/**
 * Rune-backed mutable box for tests. Runes only compile in `.svelte.ts`
 * modules, so the plain `.test.ts` file imports this instead of using
 * `$state` directly.
 */
export function createBox<T>(initial: T): { value: T } {
  let value = $state(initial)
  return {
    get value() {
      return value
    },
    set value(next: T) {
      value = next
    },
  }
}
