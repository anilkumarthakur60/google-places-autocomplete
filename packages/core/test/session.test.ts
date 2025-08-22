import { describe, expect, it } from 'vitest'
import { createSessionToken, SessionTokenManager } from '../src/session'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('createSessionToken', () => {
  it('returns a v4 UUID', () => {
    expect(createSessionToken()).toMatch(UUID_V4_RE)
  })

  it('returns a different token each call', () => {
    expect(createSessionToken()).not.toBe(createSessionToken())
  })
})

describe('SessionTokenManager', () => {
  it('lazily creates a token and reuses it until reset', () => {
    const manager = new SessionTokenManager()
    const first = manager.get()
    expect(first).toMatch(UUID_V4_RE)
    expect(manager.get()).toBe(first)

    manager.reset()
    const second = manager.get()
    expect(second).not.toBe(first)
  })
})
