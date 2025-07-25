/**
 * Google bills Autocomplete + Place Details as a single session when every
 * request in the flow shares one session token — one lookup, not two. A new
 * token must be generated per session; reusing a token across sessions (or
 * never resetting one) forfeits that billing benefit.
 */
export function createSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID. This only needs to
  // be unique per session, not cryptographically secure.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class SessionTokenManager {
  private token: string | null = null

  /** Lazily creates the token for this session on first use. */
  get(): string {
    this.token ??= createSessionToken()
    return this.token
  }

  /** Call after a place is selected (or the session otherwise ends) so the next search starts a fresh session. */
  reset(): void {
    this.token = null
  }
}
