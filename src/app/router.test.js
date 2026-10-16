import { describe, expect, it } from 'vitest'
import { PATHS, resolveRoute } from './router.js'

const newVisitor = { signingHand: null, setupDone: false }
const choseHand = { signingHand: 'left', setupDone: false }
const returning = { signingHand: 'right', setupDone: true }

describe('resolveRoute', () => {
  it('opens every page but Welcome for a returning visitor', () => {
    for (const [page, path] of Object.entries(PATHS)) {
      if (page !== 'welcome') expect(resolveRoute(path, returning)).toEqual({ page })
    }
  })

  it('sends a returning visitor from Welcome to Record', () => {
    expect(resolveRoute('/', returning)).toEqual({ redirect: '/record' })
  })

  it('sends a new visitor from Record, Learn and Practice to Welcome', () => {
    for (const path of ['/record', '/learn', '/practice']) {
      expect(resolveRoute(path, newVisitor)).toEqual({ redirect: '/' })
    }
  })

  it('lets a new visitor open Welcome, the intro pages, the signing hand and /dev', () => {
    for (const page of ['welcome', 'about', 'howSemaWorks', 'privacy', 'signingHand', 'dev']) {
      expect(resolveRoute(PATHS[page], newVisitor)).toEqual({ page })
    }
  })

  it('serves the intro pages at their own addresses', () => {
    expect(resolveRoute('/about', newVisitor)).toEqual({ page: 'about' })
    expect(resolveRoute('/how-it-works', newVisitor)).toEqual({ page: 'howSemaWorks' })
    expect(resolveRoute('/privacy', returning)).toEqual({ page: 'privacy' })
  })

  it('asks for the signing hand before the camera check', () => {
    expect(resolveRoute('/setup/camera', newVisitor)).toEqual({ redirect: '/setup/hand' })
    expect(resolveRoute('/setup/camera', choseHand)).toEqual({ page: 'cameraCheck' })
  })

  it('ignores a trailing slash', () => {
    expect(resolveRoute('/record/', returning)).toEqual({ page: 'record' })
  })

  it('sends unknown paths to Welcome', () => {
    expect(resolveRoute('/nope', newVisitor)).toEqual({ redirect: '/' })
    expect(resolveRoute('/record.html', returning)).toEqual({ redirect: '/' })
  })
})
