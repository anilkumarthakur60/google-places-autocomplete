// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { bindOutsideClose } from '../src/outside-close'

describe('bindOutsideClose', () => {
  it('calls onOutside when the press is outside root', () => {
    const root = document.createElement('div')
    const outside = document.createElement('button')
    document.body.append(root, outside)

    const onOutside = vi.fn()
    const unbind = bindOutsideClose(root, onOutside)

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onOutside).toHaveBeenCalledTimes(1)

    unbind()
  })

  it('does not call onOutside when the press is inside root', () => {
    const root = document.createElement('div')
    const inner = document.createElement('button')
    root.append(inner)
    document.body.append(root)

    const onOutside = vi.fn()
    const unbind = bindOutsideClose(root, onOutside)

    inner.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onOutside).not.toHaveBeenCalled()

    unbind()
  })

  it('stops listening after the returned cleanup runs', () => {
    const root = document.createElement('div')
    const outside = document.createElement('button')
    document.body.append(root, outside)

    const onOutside = vi.fn()
    const unbind = bindOutsideClose(root, onOutside)
    unbind()

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onOutside).not.toHaveBeenCalled()
  })
})
