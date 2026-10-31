import { useEffect, useRef, useState } from 'react'
import { createHand } from './hand.js'

// How far one arrow key turns the hand: 15°.
const KEY_TURN = Math.PI / 12

// The 3D hand (Eidos's viewer, hand.js) making a letter's pose, facing the
// signing hand. Drag it, or focus it and press ← →, to turn it. Learn loads
// this file with lazy(), so three.js is only downloaded by someone who
// chooses 3D, for a letter that has a pose.
// The viewer is made once per mount and disposed on unmount, which frees its
// WebGL context (StrictMode's double mount in development makes one, throws
// it away, and makes another). A new pose or hand goes to the same viewer,
// which eases into it. If the hand can't be drawn (no WebGL, or the model
// didn't load), `fallback` (the drawing) shows instead.
export default function HandModelView({ letter, pose, hand, fallback }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const [failed, setFailed] = useState(false)

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
      if (!loaded && !cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
      viewerRef.current = null
      viewer?.dispose()
    }
  }, [])

  useEffect(() => {
    viewerRef.current?.setSide(hand)
  }, [hand])

  useEffect(() => {
    viewerRef.current?.setPose(pose)
  }, [pose])

  function turn(event) {
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key]
    if (!direction) return
    event.preventDefault() // the page doesn't scroll sideways
    viewerRef.current?.spinBy(direction * KEY_TURN)
  }

  if (failed) return fallback
  return (
    <div
      ref={containerRef}
      className="hand-model-view"
      role="img"
      aria-label={`3D hand making ${letter}. Drag, or use the left and right arrow keys, to turn it.`}
      tabIndex={0}
      onKeyDown={turn}
    />
  )
}
