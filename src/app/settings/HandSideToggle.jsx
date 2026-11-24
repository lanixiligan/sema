// The Left hand | Right hand switch for pictures with no camera (Guess the
// letter, 2026-11-04; Handshapes, 2026-11-14): which hand the pictures show,
// the saved signing hand (the same setting as the camera pages' switch, so a
// choice carries over to Learn and the Words quiz). `hand` is 'left' or
// 'right'; `onChange` gets the new one.
//
// Two looks:
// - 'picture' (the default, Guess the letter): like the 2D | 3D switch
//   (`hand-view-switch`), in the picture frame's lower left corner.
// - 'camera' (Handshapes, 2026-11-15): exactly the switch in Learn's camera
//   controls, the same dark pill with the chosen hand in Bright Sky. It uses
//   the camera controls' own classes, so the two always look the same.
const HANDS = [
  { id: 'left', name: 'Left hand' },
  { id: 'right', name: 'Right hand' },
]

export default function HandSideToggle({ hand, onChange, look = 'picture' }) {
  const buttons = HANDS.map((option) => (
    <button key={option.id} type="button" aria-pressed={hand === option.id} onClick={() => onChange(option.id)}>
      {option.name}
    </button>
  ))

  if (look === 'camera') {
    return (
      <div className="camera-controls-pill">
        <div className="camera-controls-segment" role="group" aria-label="Signing hand">
          {buttons}
        </div>
      </div>
    )
  }

  return (
    <div className="view-switch hand-view-switch" role="group" aria-label="Signing hand">
      {buttons}
    </div>
  )
}
