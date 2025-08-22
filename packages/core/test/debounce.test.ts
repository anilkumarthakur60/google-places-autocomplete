import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce } from '../src/debounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  it('coalesces rapid calls into one, using the last arguments', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced.run('a')
    debounced.run('b')
    debounced.run('c')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('cancel() prevents the pending call from firing', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced.run('a')
    debounced.cancel()
    vi.advanceTimersByTime(200)

    expect(fn).not.toHaveBeenCalled()
  })
})
