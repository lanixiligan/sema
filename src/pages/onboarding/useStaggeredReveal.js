import { useEffect, useMemo, useReducer } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js'

// A page's items appearing one after another: the first straight away, then
// one more every `delayMs`. `shown` counts the items on screen; `instant`
// means show them without animating (after a click or key press, or with
// reduced motion). The rules are a reducer, so they're tested without a
// browser.
export function startReveal({ count, reduceMotion }) {
  if (reduceMotion) return { count, shown: count, instant: true }
  return { count, shown: Math.min(1, count), instant: false }
}

export function revealReducer(state, action) {
  switch (action.type) {
    case 'next':
      return state.shown >= state.count ? state : { ...state, shown: state.shown + 1 }
    case 'showAll':
      return state.instant && state.shown === state.count ? state : { ...state, shown: state.count, instant: true }
    default:
      return state
  }
}

// The hook pages use: `itemClass(i)` for each item (in page order), and
// `containerClass` for the element around them. The CSS does the rest:
// waiting items are transparent but still in the page, so screen readers
// read everything from the start; shown items play the reveal-in animation.
export function useStaggeredReveal(count, delayMs = 350) {
  const reduceMotion = usePrefersReducedMotion()
  const [state, dispatch] = useReducer(revealReducer, { count, reduceMotion }, startReveal)
  const done = state.shown >= state.count

  // One timer per step. Each render that shows a new item sets the next one.
  useEffect(() => {
    if (done) return
    const timer = setTimeout(() => dispatch({ type: 'next' }), delayMs)
    return () => clearTimeout(timer)
  }, [done, state.shown, delayMs])

  // Any click or key press shows everything at once. The event still does its
  // usual job: Tab moves focus, a click on Continue still goes on.
  useEffect(() => {
    if (done) return
    const showAll = () => dispatch({ type: 'showAll' })
    window.addEventListener('pointerdown', showAll)
    window.addEventListener('keydown', showAll)
    return () => {
      window.removeEventListener('pointerdown', showAll)
      window.removeEventListener('keydown', showAll)
    }
  }, [done])

  return useMemo(
    () => ({
      containerClass: state.instant ? 'reveal-instant' : '',
      itemClass: (index) => (index < state.shown ? 'reveal-in' : 'reveal-wait'),
    }),
    [state.instant, state.shown],
  )
}
