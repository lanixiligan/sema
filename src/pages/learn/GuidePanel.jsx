import { useEffect, useRef } from 'react'
import { LETTERS } from '../../vision/landmarks/letterShapes.js'

// The letter guide in the left column: a slim rail of small letter tiles, two
// per row, A to Z. The drawings that used to be here are on the letter's card
// on the right, so this is only for picking. Clicking a tile picks the letter
// to practise (selected). Each tile is a real button, so the keyboard and
// screen readers can use it; aria-pressed says which one is picked.
export default function GuidePanel({ selected, onSelect }) {
  const listRef = useRef(null)

  // When the picked letter changes (a click, or Next letter), scroll the rail
  // just far enough to show its tile. All 26 usually fit, so this only matters
  // in a short window. We set the rail's own scroll position instead of calling
  // scrollIntoView, which could also scroll the page around it.
  useEffect(() => {
    const list = listRef.current
    const tile = list?.querySelector('[aria-pressed="true"]')
    if (!list || !tile) return
    const top = tile.offsetTop - list.offsetTop
    const bottom = top + tile.offsetHeight
    if (top < list.scrollTop) {
      list.scrollTo({ top: top - 6 })
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight + 6 })
    }
  }, [selected])

  return (
    <section className="practice-guide" aria-labelledby="practice-guide-title">
      <h2 id="practice-guide-title" className="visually-hidden">
        Letter guide
      </h2>
      <ul className="practice-guide-tiles" ref={listRef}>
        {LETTERS.map((letter) => (
          <li key={letter}>
            <button
              type="button"
              className="practice-guide-tile"
              aria-pressed={letter === selected}
              onClick={() => onSelect(letter)}
            >
              {letter}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
