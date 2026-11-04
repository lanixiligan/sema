import { useEffect, useRef } from 'react'
import { CheckIcon } from '../../components/icons/icons.jsx'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// The letter guide: one row of 26 tiles, A to Z, above the camera and the
// lesson (2026-11-02; before, a slim two-column rail on the left). It's only
// for picking, since the drawing is on the lesson. The tile of the letter
// being practised is lit; a letter passed during this visit gets a green tick
// (`done`, a Set held by LearnPage: nothing is saved yet, so it starts empty
// on every visit). Each tile is a real button, so the keyboard and screen
// readers can use it; aria-pressed says which one is picked.
export default function GuidePanel({ selected, done, onSelect }) {
  // On a small screen the row scrolls sideways (see "Small screens" in
  // styles.css), so the picked letter can be off to the side, for example after
  // Next letter. This keeps it in view. `inline: 'center'` scrolls only the
  // row; `block: 'nearest'` leaves the page where it is.
  const row = useRef(null)
  const thumb = useRef(null)

  // The scroll track under the row (phones only, see styles.css): a thin line
  // with a thumb, like a scroll bar the browser would hide on a phone. The
  // thumb is as wide as the part of the row in view, and moves as it scrolls,
  // so how much is off to the side can be seen at a glance. It's set on the
  // element directly: it changes on every scroll event, and React doesn't need
  // to draw the page again for that.
  function updateThumb() {
    const list = row.current
    const bar = thumb.current
    if (!list || !bar) return
    const { scrollLeft, scrollWidth, clientWidth } = list
    const share = clientWidth / scrollWidth
    const hidden = scrollWidth - clientWidth
    const where = hidden > 0 ? scrollLeft / hidden : 0
    bar.style.width = `${share * 100}%`
    // A percentage in translateX is of the thumb's own width; the thumb can
    // travel (1 / share - 1) of its width, so this lands on the track's end.
    bar.style.transform = `translateX(${where * (1 / share - 1) * 100}%)`
  }

  useEffect(() => {
    updateThumb()
    window.addEventListener('resize', updateThumb)
    return () => window.removeEventListener('resize', updateThumb)
  }, [])

  useEffect(() => {
    const tile = row.current?.querySelector('[aria-pressed="true"]')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    tile?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: calm ? 'auto' : 'smooth' })
  }, [selected])

  return (
    <section className="learn-strip" aria-labelledby="learn-strip-title">
      <h2 id="learn-strip-title" className="visually-hidden">
        Letter guide
      </h2>
      <ul ref={row} onScroll={updateThumb}>
        {LETTERS.map((letter) => (
          <li key={letter}>
            <button
              type="button"
              className={done.has(letter) ? 'learn-tile done' : 'learn-tile'}
              aria-pressed={letter === selected}
              onClick={() => onSelect(letter)}
            >
              {letter}
              {done.has(letter) && (
                <>
                  <span className="learn-tile-tick" aria-hidden="true">
                    <CheckIcon size={11} strokeWidth={3.5} />
                  </span>
                  <span className="visually-hidden"> (done)</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="learn-scroll" aria-hidden="true">
        <div ref={thumb} className="learn-scroll-thumb" />
      </div>
    </section>
  )
}
