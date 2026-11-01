import { useSettings } from './settings.js'

// The 2D | 3D switch in the upper left corner of every picture of a hand
// (LetterPicture: Learn's letter card and the quiz's Peek): the drawing, or the
// 3D hand. It's one saved setting (`handView`), so a click changes every
// picture at once. (Learn's card had it from 2026-10-31; for a few hours on
// 2026-11-02 it was in the top bar, then it went onto the pictures.) Like the
// guide's tiles, aria-pressed says which one is showing. A letter with no 3D
// hand yet still shows its drawing, with a line saying so, so 3D is never
// greyed out here.
export default function HandViewToggle() {
  const { handView, setHandView } = useSettings()
  return (
    <div className="view-switch hand-view-switch" role="group" aria-label="Hand picture">
      <button type="button" aria-pressed={handView === '2d'} onClick={() => setHandView('2d')}>
        2D
      </button>
      <button type="button" aria-pressed={handView === '3d'} onClick={() => setHandView('3d')}>
        3D
      </button>
    </div>
  )
}
