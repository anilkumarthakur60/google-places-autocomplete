export interface Debounced<Args extends unknown[]> {
  run: (...args: Args) => void
  cancel: () => void
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    run(...args: Args) {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        fn(...args)
      }, ms)
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}
