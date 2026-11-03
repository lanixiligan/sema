import { useEffect, useRef, useState } from 'react'
import { createHand } from './hand.js'

// The 3D hand (Eidos's viewer, hand.js) making a letter's pose, facing the
// signing hand. Grab it to turn it (the mouse or a finger; it has no keyboard
// controls, 2026-11-02, so it isn't a stop for the Tab key). Learn loads
// this file with lazy(), so three.js is only downloaded by someone who
// chooses 3D, for a letter that has a pose.
// The viewer is made once per mount and disposed on unmount, which frees its
// WebGL context (StrictMode's double mount in development makes one, throws
// it away, and makes another). A new pose or hand goes to the same viewer,
// which eases into it, `numbers` shows or hides the fingertip numbers, and a new letter also eases the hand back to its
// starting angle. If the hand can't be drawn (no WebGL, or the model
// didn't load), `fallback` (the drawing) shows instead.
// `theme` ('light' or 'dark', the theme on screen) picks the hand's blue to
// suit its frame: Deep Sky on a light one, Bright Sky on a dark one.
// `onSettled` (2026-11-04, for the 2D | 3D switch's loading state) is called
// once the wait is over either way: the hand is ready, or it failed and
// `fallback` took its place.
export default function HandModelView({ letter, pose, hand, theme = 'light', numbers = true, fallback, onSettled }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const [failed, setFailed] = useState(false)
  // The latest onSettled, read when the model has loaded, so a new function
  // each render doesn't remake the viewer.
  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onSettledRef.current = onSettled
  })

  useEffect(() => {
    // Not starting (no WebGL) and a model that didn't load end the same way:
    // `ready` says false, and the drawing takes the frame.
    let viewer = null
    try {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      viewer = createHand(containerRef.current, { background: false, zoom: false, reducedMotion })
    } catch (error) {
      console.warn('The 3D hand could not start.', error)
    }
    viewerRef.current = viewer
    let cancelled = false
    const ready = viewer ? viewer.ready : Promise.resolve(false)
    ready.then((loaded) => {
      if (cancelled) return
      if (!loaded) setFailed(true)
      onSettledRef.current?.()
    })
    return () => {
      cancelled = true
      viewerRef.current = null
      viewer?.dispose()
    }
  }, [])

  // Runs after the effect that makes the viewer, so a first mount gets its
  // color too; a theme change later recolors the same viewer.
  useEffect(() => {
    viewerRef.current?.setMode(theme)
  }, [theme])

  useEffect(() => {
    viewerRef.current?.setSide(hand)
  }, [hand])

  useEffect(() => {
    viewerRef.current?.setPose(pose)
  }, [pose])

  // The fingertip numbers, shown or hidden by the Numbers button.
  useEffect(() => {
    viewerRef.current?.setNumbersVisible(numbers)
  }, [numbers])

  // A different letter starts from the starting angle: the hand eases back from
  // wherever it was turned to (resetView). The viewer is kept between letters,
  // so without this it would stay turned. The first letter of a mount is
  // already there, so only a change counts.
  const shownLetter = useRef(letter)
  useEffect(() => {
    if (shownLetter.current === letter) return
    shownLetter.current = letter
    viewerRef.current?.resetView()
  }, [letter])

  if (failed) return fallback
  return (
    <div
      ref={containerRef}
      className="hand-model-view"
      role="img"
      aria-label={`3D hand making ${letter}. Grab it to turn it.`}
    />
  )
}
