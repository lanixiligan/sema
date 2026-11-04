import { useSettings } from './settings.js'

// The Numbers button beside the 2D | 3D switch: shows or hides the fingertip
// numbers on the 3D hand. It's one saved setting (`handNumbers`), so every 3D
// hand follows it: Learn's card, the quiz's Peek and (since 2026-11-04) the two
// hands Guess the letter compares after a wrong answer.
export default function HandNumbersToggle() {
  const { handNumbers, setHandNumbers } = useSettings()
  return (
    <button
      type="button"
      className="hand-numbers-toggle"
      aria-pressed={handNumbers}
      title="Show or hide the finger numbers"
      onClick={() => setHandNumbers(!handNumbers)}
    >
      Numbers
    </button>
  )
}
