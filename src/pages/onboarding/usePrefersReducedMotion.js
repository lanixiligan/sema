import { useSyncExternalStore } from 'react'

// True when the person has asked their system for less motion. The CSS turns
// animations off by itself; this is for the JavaScript side (the intro pages'
// reveal shows everything at once). useSyncExternalStore keeps a component in step with
// something outside React, here the media query, and re-renders if it changes.
const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
}
