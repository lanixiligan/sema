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

  it('sends a returning visitor from Welcome to Learn', () => {
    expect(resolveRoute('/', returning)).toEqual({ redirect: '/learn' })
  })

  it('sends a new visitor from Learn and the quiz pages to Welcome', () => {
    for (const path of ['/learn', '/quiz', '/quiz/letters', '/quiz/words']) {
      expect(resolveRoute(path, newVisitor)).toEqual({ redirect: '/' })
    }
  })

  it('sends the old Try and Practice addresses to Learn', () => {
    for (const path of ['/try', '/try/', '/practice']) {
      expect(resolveRoute(path, returning)).toEqual({ redirect: '/learn' })
    }
  })

  it('lets a new visitor open Welcome, About, the camera check and /dev', () => {
    for (const page of ['welcome', 'about', 'cameraCheck', 'dev']) {
      expect(resolveRoute(PATHS[page], newVisitor)).toEqual({ page })
    }
  })

  it('serves the developer dashboard and each tool, without setup', () => {
    expect(resolveRoute('/dev', newVisitor)).toEqual({ page: 'dev' })
    expect(resolveRoute('/dev/tracking', newVisitor)).toEqual({ page: 'devTracking' })
    expect(resolveRoute('/dev/extract', newVisitor)).toEqual({ page: 'devExtract' })
    expect(resolveRoute('/dev/record', newVisitor)).toEqual({ page: 'devRecord' })
  })

  it('sends the old developer Try address to Learn', () => {
    expect(resolveRoute('/dev/try', returning)).toEqual({ redirect: '/learn' })
  })

  it('sends the old Record address to the main page, Learn', () => {
    expect(resolveRoute('/record', returning)).toEqual({ redirect: '/learn' })
  })

  it('serves About to new and returning visitors', () => {
    expect(resolveRoute('/about', newVisitor)).toEqual({ page: 'about' })
    expect(resolveRoute('/about', returning)).toEqual({ page: 'about' })
  })

  it('sends the old intro addresses to About', () => {
    for (const path of ['/how-it-works', '/privacy']) {
      expect(resolveRoute(path, newVisitor)).toEqual({ redirect: '/about' })
    }
  })

  it('sends the old setup addresses to the camera check and About', () => {
    expect(resolveRoute('/setup/camera', newVisitor)).toEqual({ redirect: PATHS.cameraCheck })
    expect(resolveRoute('/setup/hand', newVisitor)).toEqual({ redirect: PATHS.cameraCheck })
    expect(resolveRoute('/setup/how-it-works', newVisitor)).toEqual({ redirect: '/about' })
  })

  it('ignores a trailing slash', () => {
    expect(resolveRoute('/learn/', returning)).toEqual({ page: 'learn' })
  })

  it('shows Page not found for an address Sema never had', () => {
    expect(resolveRoute('/nope', newVisitor)).toEqual({ page: 'notFound' })
    expect(resolveRoute('/record.html', returning)).toEqual({ page: 'notFound' })
    expect(resolveRoute('/LEARN', returning)).toEqual({ page: 'notFound' })
  })
})
