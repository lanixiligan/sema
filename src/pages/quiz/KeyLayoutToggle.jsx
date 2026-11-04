// The A to Z | Keyboard switch above Guess the letter's keys (2026-11-04): the keys
// in alphabetical order, or in a keyboard's (QWERTY) rows, so the person can look
// for a letter where their fingers expect it. It's the saved `keyLayout` setting
// and looks like the 2D | 3D switch (`view-switch`), a little smaller.
// `layout` is 'alphabet' or 'keyboard'; `onChange` gets the new one.
export default function KeyLayoutToggle({ layout, onChange }) {
  return (
    <div className="view-switch guess-layout-switch" role="group" aria-label="Order of the letter keys">
      <button type="button" aria-pressed={layout === 'alphabet'} onClick={() => onChange('alphabet')}>
        A to Z
      </button>
      <button type="button" aria-pressed={layout === 'keyboard'} onClick={() => onChange('keyboard')}>
        Keyboard
      </button>
    </div>
  )
}
