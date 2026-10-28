import { useEffect, useRef, useState } from 'react'
import AslDrawing from '../../components/AslDrawing.jsx'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// The letter guide in the left column: one large card per letter (its drawing,
// facing the signing hand, and the letter), in a single column that scrolls
// inside the panel. Clicking a card picks the letter to practise (selected).
// Each card is a real button, so the keyboard and screen readers can use it;
// aria-pressed says which one is picked. A List | Grid switch in the title row
// shows the cards one per row (large) or three per row (compact). The choice
// is only remembered while the page is open.
export default function GuidePanel({ hand, selected, onSelect }) {
  const listRef = useRef(null)
  const [grid, setGrid] = useState(false)

  // When the picked letter changes (a click, or Next letter), scroll the list.
  // In List mode the card goes to the middle of the list (the first and last
  // ones can't get there: the list stops scrolling at its ends). In Grid mode
  // it only scrolls as far as needed to show the card. We set the list's own
  // scroll position instead of calling scrollIntoView, which could also scroll
  // the page around it. Whether it glides or jumps is the CSS's choice
  // (scroll-behavior on .practice-guide-tiles): smooth, unless the person asked
  // their system for reduced motion.
  useEffect(() => {
    const list = listRef.current
    const card = list?.querySelector('[aria-pressed="true"]')
    if (!list || !card) return
    const top = card.offsetTop - list.offsetTop
    const bottom = top + card.offsetHeight
    if (!grid) {
      list.scrollTo({ top: top - (list.clientHeight - card.offsetHeight) / 2 })
    } else if (top < list.scrollTop) {
      list.scrollTo({ top: top - 6 })
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight + 6 })
    }
  }, [selected, grid])

  return (
    <section className="practice-guide" aria-labelledby="practice-guide-title">
      <div className="practice-guide-head">
        <h2 id="practice-guide-title" className="practice-guide-title">
          Letter guide
        </h2>
        <div className="practice-guide-layout" role="group" aria-label="Letter layout">
          <button type="button" aria-pressed={!grid} onClick={() => setGrid(false)}>
            List
          </button>
          <button type="button" aria-pressed={grid} onClick={() => setGrid(true)}>
            Grid
          </button>
        </div>
      </div>
      <ul className={grid ? 'practice-guide-tiles is-grid' : 'practice-guide-tiles'} ref={listRef}>
        {LETTERS.map((letter) => (
          <li key={letter}>
            <button
              type="button"
              className="practice-guide-tile"
              aria-pressed={letter === selected}
              onClick={() => onSelect(letter)}
            >
              <span className="practice-guide-drawing">
                <AslDrawing letter={letter} hand={hand} />
              </span>
              {letter}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
