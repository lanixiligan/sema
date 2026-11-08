import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../../app/settings/settings.js'

// Space between a target and its ring, and between the ring and the card.
const RING_GAP = 6
const CARD_GAP = 14
// The card's width, and the height it's assumed to need when choosing a side
// (the real height depends on the text; this is a little more than most steps).
const CARD_WIDTH = 320
const CARD_HEIGHT = 230
const EDGE = 16

// Learn's first-visit tour (2026-11-07): a card that walks through the page one
// part at a time, with the rest of the page dimmed and a ring around the part
// it's about. Back, Next (Done on the last step) and Skip tour; the arrow keys
// and Escape do the same. Finishing or skipping calls `onClose` with the
// person's own 2D | 3D choice, and LearnPage saves that the tour was seen.
// (For a day, 2026-11-08, the Quiz page had a tour of its own too; the quizzes
// are now a step of this one.)
//
// `steps` is the list in tourSteps.js. Each step:
// - `title` and `text`: what the card says.
// - `target`: where the ring goes, as CSS selectors tried in order; the first
//   one on screen wins, so a step can fall back to a bigger part of the page
//   when the exact control isn't there. Left out: no ring, the card alone in
//   the middle of the window.
// - `view` (optional): '3d' shows the 3D hand during the step.
// - `interactive` (optional): the person can use what's inside the ring.
//   Otherwise the whole page is blocked while the tour is open.
//
// How the ring finds its target: every animation frame (about 60 times a
// second) it asks the browser where the target is now, with
// getBoundingClientRect(), so the ring follows the page when it scrolls, the
// window is resized, or a part changes size (the 3D hand loading). React only
// re-renders when the position actually changed.
export default function Tour({ steps, onClose }) {
  const { handView, setHandView } = useSettings()
  const [index, setIndex] = useState(0)
  // The person's own 2D | 3D choice, put back when the tour ends. State that's
  // never set again: it keeps the value from the tour's first render.
  const [startView] = useState(handView)
  const nextButton = useRef(null)
  const step = steps[index]
  const last = index === steps.length - 1
  const rect = useTargetRect(step.target)

  function finish() {
    onClose(startView)
  }
  function next() {
    if (last) finish()
    else setIndex(index + 1)
  }
  function back() {
    if (index > 0) setIndex(index - 1)
  }

  // A step that's about the 3D hand shows it; the others show the person's own
  // choice. (The settings only change when they differ, so this runs no loop.)
  const wantedView = step.view ?? startView
  useEffect(() => {
    if (handView !== wantedView) setHandView(wantedView)
  }, [handView, wantedView, setHandView])

  // The keyboard lands on Next at every step, so Enter moves on.
  useEffect(() => {
    nextButton.current?.focus()
  }, [index])

  // The arrow keys and Escape, anywhere on the page. A listener on the
  // document, removed when the step changes (it's added again with the new
  // `next` and `back`) or the tour closes. While the larger picture's window
  // is open (a native <dialog>, from the turn step) the keys are its own.
  useEffect(() => {
    function handleKeyDown(event) {
      if (document.querySelector('dialog[open]')) return
      if (event.key === 'Escape') finish()
      else if (event.key === 'ArrowRight') next()
      else if (event.key === 'ArrowLeft') back()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  const hole = rect && {
    top: rect.top - RING_GAP,
    left: rect.left - RING_GAP,
    width: rect.width + RING_GAP * 2,
    height: rect.height + RING_GAP * 2,
  }

  return (
    <div className="tour">
      {/* What blocks clicks on the page: the whole window, or (on a step the
          person may try) four strips around the ring, leaving the hole open. */}
      {hole && step.interactive ? (
        <Blockers hole={hole} />
      ) : (
        <div className="tour-blocker" style={{ inset: 0 }} />
      )}
      {/* What you see: the ring, whose huge shadow dims the rest of the page,
          or with no target a plain dim layer. */}
      {hole ? <div className="tour-ring" style={hole} /> : <div className="tour-dim" />}

      <div
        className={hole ? 'tour-card' : 'tour-card is-centred'}
        style={hole ? placeCard(hole) : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        {/* aria-live: when the step changes, screen readers read the new text. */}
        <div aria-live="polite">
          <p className="tour-count">
            {index + 1} of {steps.length}
          </p>
          <h2 id="tour-title" className="tour-title">
            {step.title}
          </h2>
          <p className="tour-text">{step.text}</p>
        </div>
        <div className="tour-actions">
          {!last && (
            <button type="button" className="tour-skip" onClick={finish}>
              Skip tour
            </button>
          )}
          <span className="tour-steps">
            {index > 0 && (
              <button type="button" className="tour-back" onClick={back}>
                Back
              </button>
            )}
            <button ref={nextButton} type="button" className="button" onClick={next}>
              {last ? 'Done' : 'Next'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}

// Four invisible strips that cover the window around the hole, so clicks reach
// only what's inside the ring.
function Blockers({ hole }) {
  const right = hole.left + hole.width
  const bottom = hole.top + hole.height
  return (
    <>
      <div className="tour-blocker" style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
      <div className="tour-blocker" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <div className="tour-blocker" style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
      <div className="tour-blocker" style={{ top: hole.top, left: right, right: 0, height: hole.height }} />
    </>
  )
}

// Where the card goes, beside the ring: below it if there's room, else above,
// else to its left or right, else over the bottom of the window. (On a phone
// the CSS puts it at the bottom of the window whatever this says.)
function placeCard(hole) {
  const width = window.innerWidth
  const height = window.innerHeight
  const bottom = hole.top + hole.height
  const right = hole.left + hole.width
  // Centred on the ring, but never past the window's edges.
  const left = clamp(hole.left + hole.width / 2 - CARD_WIDTH / 2, EDGE, width - CARD_WIDTH - EDGE)
  const top = clamp(hole.top + hole.height / 2 - CARD_HEIGHT / 2, EDGE, height - CARD_HEIGHT - EDGE)

  if (height - bottom >= CARD_HEIGHT + CARD_GAP) return { top: bottom + CARD_GAP, left }
  if (hole.top >= CARD_HEIGHT + CARD_GAP) return { bottom: height - hole.top + CARD_GAP, left }
  if (hole.left >= CARD_WIDTH + CARD_GAP + EDGE) return { top, left: hole.left - CARD_WIDTH - CARD_GAP }
  if (width - right >= CARD_WIDTH + CARD_GAP + EDGE) return { top, left: right + CARD_GAP }
  return { bottom: EDGE, left }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

// Where the step's target is on screen now ({ top, left, width, height } in
// window pixels), or null with no target or none found. The first time a
// target is found it's scrolled into view.
function useTargetRect(selectors) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    let frame
    let scrolled = false
    function measure() {
      const element = findTarget(selectors)
      if (element && !scrolled) {
        // On a phone the card covers the window's bottom, so the target goes to
        // the middle; on a wider window it only scrolls if it's out of view.
        const phone = window.matchMedia('(max-width: 599px)').matches
        element.scrollIntoView({ block: phone ? 'center' : 'nearest' })
        scrolled = true
      }
      const box = element?.getBoundingClientRect()
      const next = box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null
      setRect((previous) => (sameRect(previous, next) ? previous : next))
      frame = requestAnimationFrame(measure)
    }
    measure()
    return () => cancelAnimationFrame(frame)
  }, [selectors])
  return rect
}

// The first of the selectors that matches something on screen. A hidden
// element (display: none, like the burger button on a wide window) has no size.
function findTarget(selectors) {
  for (const selector of selectors ?? []) {
    const element = document.querySelector(selector)
    const box = element?.getBoundingClientRect()
    if (box && box.width > 0 && box.height > 0) return element
  }
  return null
}

function sameRect(a, b) {
  if (!a || !b) return a === b
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
}
