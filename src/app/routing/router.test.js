import { describe, expect, it } from 'vitest'
import { PATHS, resolveRoute } from './router.js'

const newVisitor = { signingHand: null, setupDone: false }
const returning = { signingHand: 'right', setupDone: true }

describe('resolveRoute', () => {
  it('opens every page but Welcome for a returning visitor', () => {
    for (const [page, path] of Object.entries(PATHS)) {
      if (page !== 'welcome') expect(resolveRoute(path, returning)).toEqual({ page })
    }
  })

  it('sends a returning visitor from Welcome to Practice', () => {
    expect(resolveRoute('/', returning)).toEqual({ redirect: '/practice' })
  })

  it('sends a new visitor from Learn and Practice to Welcome', () => {
    for (const path of ['/learn', '/practice']) {
      expect(resolveRoute(path, newVisitor)).toEqual({ redirect: '/' })
    }
  })

  it('sends the old Try address to Practice', () => {
    expect(resolveRoute('/try', returning)).toEqual({ redirect: '/practice' })
    expect(resolveRoute('/try/', returning)).toEqual({ redirect: '/practice' })
  })

  it('lets a new visitor open Welcome, the intro pages, the camera check and /dev', () => {
    for (const page of ['welcome', 'about', 'howSemaWorks', 'privacy', 'cameraCheck', 'dev']) {
      expect(resolveRoute(PATHS[page], newVisitor)).toEqual({ page })
    }
  })

  it('serves the developer dashboard and each tool, without setup', () => {
    expect(resolveRoute('/dev', newVisitor)).toEqual({ page: 'dev' })
    expect(resolveRoute('/dev/tracking', newVisitor)).toEqual({ page: 'devTracking' })
    expect(resolveRoute('/dev/extract', newVisitor)).toEqual({ page: 'devExtract' })
    expect(resolveRoute('/dev/record', newVisitor)).toEqual({ page: 'devRecord' })
  })

  it('no longer has Try inside the developer tools', () => {
    expect(resolveRoute('/dev/try', returning)).toEqual({ redirect: '/' })
  })

  it('no longer has Record outside the developer tools', () => {
    expect(resolveRoute('/record', returning)).toEqual({ redirect: '/' })
  })

  it('serves the intro pages at their own addresses', () => {
    expect(resolveRoute('/about', newVisitor)).toEqual({ page: 'about' })
    expect(resolveRoute('/how-it-works', newVisitor)).toEqual({ page: 'howSemaWorks' })
    expect(resolveRoute('/privacy', returning)).toEqual({ page: 'privacy' })
  })

  it('no longer has a signing hand page', () => {
    expect(resolveRoute('/setup/hand', newVisitor)).toEqual({ redirect: '/' })
  })

  it('ignores a trailing slash', () => {
    expect(resolveRoute('/learn/', returning)).toEqual({ page: 'learn' })
  })

  it('sends unknown paths to Welcome', () => {
    expect(resolveRoute('/nope', newVisitor)).toEqual({ redirect: '/' })
    expect(resolveRoute('/record.html', returning)).toEqual({ redirect: '/' })
  })
})
