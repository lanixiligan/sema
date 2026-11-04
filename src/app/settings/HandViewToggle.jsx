import { useSettings } from './settings.js'

// The 2D | 3D switch in the upper left corner of every picture of a hand
// (LetterPicture: Learn's letter card and the quiz's Peek): the drawing, or the
// 3D hand. It's one saved setting (`handView`), so a click changes every
// picture at once. (Learn's card had it from 2026-10-31; for a few hours on
// 2026-11-02 it was in the top bar, then it went onto the pictures.) Like the
// guide's tiles, aria-pressed says which one is showing. A letter with no 3D
// hand yet still shows its drawing, with a line saying so, so 3D is never
// greyed out here.
//
// `loading` (2026-11-04): 3D is chosen but its hand isn't on screen yet (the
// hand's pose is being fetched, or three.js and the hand model are downloading).
// The 3D button swaps its label for a small spinner, says aria-busy, and tells a
// screen reader "loading" (the label stays in the button, hidden, so the button keeps its width and
// nothing beside it moves). The switch still works while it loads: a click on 2D shows the
// drawing at once.
export default function HandViewToggle({ loading = false }) {
  const { handView, setHandView } = useSettings()
  return (
    <div className="view-switch hand-view-switch" role="group" aria-label="Hand picture">
      <button type="button" aria-pressed={handView === '2d'} onClick={() => setHandView('2d')}>
        2D
      </button>
      <button
        type="button"
        className={loading ? 'is-loading' : undefined}
        aria-pressed={handView === '3d'}
        aria-busy={loading || undefined}
        onClick={() => setHandView('3d')}
      >
        <span className="view-switch-label">3D</span>
        {loading && (
          <>
            <span className="view-switch-spinner" aria-hidden="true" />
            <span className="visually-hidden"> (loading)</span>
          </>
        )}
      </button>
    </div>
  )
}
