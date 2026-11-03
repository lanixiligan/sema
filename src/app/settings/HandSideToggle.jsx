// The Left hand | Right hand switch for pictures with no camera (Guess the
// letter, 2026-11-04): which hand the pictures show, the saved signing hand
// (the same setting as the camera pages' switch, so a choice carries over to
// Learn and the Words quiz). It looks like the 2D | 3D switch
// (`hand-view-switch`) and sits in the picture frame's lower left corner.
// `hand` is 'left' or 'right'; `onChange` gets the new one.
export default function HandSideToggle({ hand, onChange }) {
  return (
    <div className="view-switch hand-view-switch" role="group" aria-label="Signing hand">
      <button type="button" aria-pressed={hand === 'left'} onClick={() => onChange('left')}>
        Left hand
      </button>
      <button type="button" aria-pressed={hand === 'right'} onClick={() => onChange('right')}>
        Right hand
      </button>
    </div>
  )
}
