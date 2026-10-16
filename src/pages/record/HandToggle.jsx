const HANDS = [
  { id: 'left', name: 'Left' },
  { id: 'right', name: 'Right' },
]

// "Hand: Left | Right": which hand the next take is for. It starts on the
// signing hand from setup; switching it doesn't change that setting, because
// the recorder collects both hands. aria-pressed marks the one that's on.
export default function HandToggle({ hand, onChange, disabled }) {
  return (
    <div className="hand-toggle">
      <span className="hand-toggle-label">Hand</span>
      <div className="hand-toggle-options" role="group" aria-label="Hand for this take">
        {HANDS.map(({ id, name }) => (
          <button
            key={id}
            type="button"
            aria-pressed={hand === id}
            disabled={disabled}
            onClick={() => onChange(id)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
