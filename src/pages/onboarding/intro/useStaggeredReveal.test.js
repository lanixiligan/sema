import { describe, expect, it } from 'vitest'
import { revealReducer, startReveal } from './useStaggeredReveal.js'

const run = (start, actions) => actions.reduce((state, type) => revealReducer(state, { type }), start)

describe('revealReducer', () => {
  it('starts with only the first item shown', () => {
    expect(startReveal({ count: 4, reduceMotion: false })).toEqual({ count: 4, shown: 1, instant: false })
  })

  it('shows the items one after another, in order', () => {
    const start = startReveal({ count: 4, reduceMotion: false })
    expect(run(start, ['next']).shown).toBe(2)
    expect(run(start, ['next', 'next']).shown).toBe(3)
  })

  it('stops once every item is shown', () => {
    const start = startReveal({ count: 4, reduceMotion: false })
    const done = run(start, ['next', 'next', 'next'])
    expect(done.shown).toBe(4)
    expect(revealReducer(done, { type: 'next' })).toBe(done)
  })

  it('shows everything instantly on request', () => {
    const start = startReveal({ count: 4, reduceMotion: false })
    expect(run(start, ['next', 'showAll'])).toEqual({ count: 4, shown: 4, instant: true })
  })

  it('shows everything from the start with reduced motion', () => {
    expect(startReveal({ count: 4, reduceMotion: true })).toEqual({ count: 4, shown: 4, instant: true })
  })
})
