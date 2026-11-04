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
// `label` replaces the screen-reader text, which otherwise names the letter.
// `instant` (2026-11-04, the Guess quiz's small hands) puts the hand straight
// into its pose instead of easing there from the relaxed one, so a hand that
// has only just appeared doesn't visibly curl into place; `onReady` is called
// once the model has loaded and the hand is in the frame. `onSettled`
// (2026-11-04, for the 2D | 3D switch's loading state) is called once the wait is over
// either way: the hand is ready, or it failed and `fallback` took its place.
// A letter that moves (J and Z, 2026-11-04) plays its movement on a loop
// (the effect on `pose` below), with a progress bar along the frame's bottom
// edge, like a video's: it fills while the hand moves, stays full while it
// holds the last step, and starts again from empty with the next play.

// A movement's loop: how long the hand rests on the first step before it
// moves, holds the last step, and takes to ease back to the first (ms).
const MOTION_REST_MS = 800
const MOTION_HOLD_MS = 1200
const MOTION_BACK_MS = 600

export default function HandModelView({ letter, pose, hand, theme = 'light', numbers = true, fallback, label, instant = false, onReady, onSettled }) {
  const containerRef = useRef(null)
  // The movement's progress bar (only for a pose that moves)
  const barRef = useRef(null)
  const viewerRef = useRef(null)
  const [failed, setFailed] = useState(false)
  // The latest onReady, read when the model has loaded, so a new function each
  // render doesn't remake the viewer.
  const onReadyRef = useRef(onReady)
  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onReadyRef.current = onReady
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
      if (loaded) onReadyRef.current?.()
      else setFailed(true)
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

  // A still pose is set once. A pose that moves (J, Z: its `motion`) plays on
  // a loop: it rests on its first step, plays the movement, holds the last
  // step, eases back to the first and starts again. With reduced motion it
  // plays once, then goes back to the first step (the handshape the letter
  // starts from, as in its drawing). A new pose, or the hand going away, ends
  // the loop (`stopped`); the viewer's next setPose stops a movement midway.
  // The bar shows the share of the movement's time gone by (0 to 1, the
  // --motion-progress variable the CSS draws it from). It's written straight
  // onto the element on every frame of a play (requestAnimationFrame), not
  // kept in React state, which would render the component 60 times a second.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.setPose(pose, { instant })
    if (!pose.motion) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = pose.motion.reduce((sum, step) => sum + step.duration, 0)
    const showProgress = (share) => barRef.current?.style.setProperty('--motion-progress', share)
    let stopped = false
    let timer = null
    let frame = 0
    const wait = (ms) => new Promise((resolve) => (timer = setTimeout(resolve, ms)))
    async function loop() {
      showProgress(0)
      // Not before the hand is on screen, or the first play would be missed
      if (!(await viewer.ready) || stopped) return
      await wait(MOTION_REST_MS)
      while (!stopped) {
        const start = performance.now()
        const tick = (now) => {
          showProgress(Math.min(1, Math.max(0, (now - start) / total)))
          frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        const finished = await viewer.playMotion(pose)
        cancelAnimationFrame(frame)
        if (stopped || !finished) return
        showProgress(1)
        await wait(MOTION_HOLD_MS)
        if (stopped) return
        showProgress(0)
        viewer.setPose(pose, { duration: MOTION_BACK_MS })
        if (calm) return
        await wait(MOTION_BACK_MS + MOTION_REST_MS)
      }
    }
    loop()
    return () => {
      stopped = true
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [pose, instant])

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
  // The bar is a sibling of the canvas's box, placed against the picture's
  // frame. It's decoration for a screen reader: the movement is the picture's.
  return (
    <>
      <div
        ref={containerRef}
        className="hand-model-view"
        role="img"
        aria-label={label ?? `3D hand making ${letter}. Grab it to turn it.`}
      />
      {pose.motion && (
        <div ref={barRef} className="hand-motion-bar" aria-hidden="true">
          <span className="hand-motion-fill" />
          <span className="hand-motion-thumb" />
        </div>
      )}
    </>
  )
}
