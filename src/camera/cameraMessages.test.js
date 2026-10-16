import { describe, expect, it } from 'vitest'
import { cameraErrorKind } from './cameraMessages.js'

const error = (name) => Object.assign(new Error(name), { name })

describe('cameraErrorKind', () => {
  it('tells blocked, busy and missing cameras apart', () => {
    expect(cameraErrorKind(error('NotAllowedError'))).toBe('blocked')
    expect(cameraErrorKind(error('NotReadableError'))).toBe('busy')
    expect(cameraErrorKind(error('AbortError'))).toBe('busy') // Firefox's busy camera
    expect(cameraErrorKind(error('NotFoundError'))).toBe('noCamera')
  })

  it('calls anything else "other"', () => {
    expect(cameraErrorKind(error('TypeError'))).toBe('other')
    expect(cameraErrorKind(undefined)).toBe('other')
  })
})
