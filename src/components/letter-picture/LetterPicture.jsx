import { Suspense, lazy, useState } from 'react'
import HandViewToggle from '../../app/settings/HandViewToggle.jsx'
import { useSettings } from '../../app/settings/settings.js'
import AslDrawing from '../AslDrawing.jsx'
import { CloseIcon, ExpandIcon } from '../icons/icons.jsx'
import PictureDialog from './PictureDialog.jsx'

// Loaded only when a letter with a pose is shown in 3D, so a visitor who keeps
// the drawings never downloads three.js.
const HandModelView = lazy(() => import('../../hand-model/HandModelView.jsx'))

// A letter's picture: the letter's drawing, or the 3D hand making it, from its
// pose (`pose`, useLetterPose), by `view`, the saved 2D | 3D choice. The
// choice is made with the switch in the frame's upper left corner, so every
// picture of a hand has it. With 3D chosen, a letter with no pose says so in
// the frame instead of showing the drawing (2026-11-02; before, it fell back to
// the drawing with a line), and the switch is still there to go back to 2D. Both face the signing hand and sit in the
// same frame, so switching never moves what's around it. The frame follows the
// theme: white in the light one, dark in the dark one, where the drawing
// is white lines (AslDrawing) and the 3D hand turns Bright Sky
// (`theme` on the viewer).
// Shared by Learn's letter card and the quiz's Peek (2026-11-02; before, in
// pages/learn/). `className` goes on the frame, for the page's own size. With
// `notes` false the tip on the 3D hand ("Grab the hand…") and the Numbers
// button (shows or hides the fingertip numbers, a saved setting) are left out,
// for a frame whose size is fixed (the quiz's sticker). The tip is a small dark pill
// on the picture's upper right with a close button; once closed it stays
// closed (the saved setting `turnTipClosed`), in every picture.
//
// The button in the frame's lower right corner shows the same picture large,
// in a window over the page (PictureDialog), to study a handshape or turn the
// 3D hand. The picture in the window is this same component, `large`, without
// its own expand button.
//
// The frame and the switch are the same elements in every state, so a click on
// the switch keeps its focus while the picture changes under it.
//
// `corner` (2026-11-04, Guess the letter's Left hand | Right hand switch): anything
// the page wants in the frame's lower left corner, left out of the larger window.
//
// `hideLetter` (Guess the letter, 2026-11-04): the picture is the question, so
// nothing it says names the letter: not the alt text, the larger window's
// title, the expand button nor the "No 3D hand" note.
export default function LetterPicture({
  letter,
  hand,
  view,
  pose,
  className = '',
  notes = true,
  large = false,
  hideLetter = false,
  corner = null,
}) {
  const [expanded, setExpanded] = useState(false)
  // True once the 3D hand in this frame has loaded (or failed and been replaced
  // by the drawing); reset below whenever the hand leaves the frame.
  const [modelSettled, setModelSettled] = useState(false)
  const { shownTheme, turnTipClosed, closeTurnTip, handNumbers, setHandNumbers } = useSettings()
  const alt = hideLetter ? 'The handshape to name' : `Handshape for ${letter}`
  const drawing = <AslDrawing letter={letter} hand={hand} alt={alt} />
  let picture = drawing
  let tip = false

  if (view === '3d') {
    if (pose.status === 'loading') {
      // The first answer of the visit isn't in yet: an empty frame, for a moment.
      picture = <p className="hand-model-wait">Loading the 3D hand…</p>
    } else if (pose.status === 'unavailable') {
      // pose.letter can still be the previous letter for a moment, until this
      // one's answer arrives, so the frame waits for it (the drawing, not a
      // flash of "no 3D hand" for a letter that has one).
      if (pose.letter === letter) {
        picture = (
          <div className="hand-model-missing">
            <p className="hand-model-missing-title">
              {hideLetter ? 'No 3D hand for this letter yet' : `No 3D hand for ${letter} yet`}
            </p>
            <p>Switch to 2D to see its drawing.</p>
          </div>
        )
      }
    } else {
      // A 3D hand stays up while the next letter's pose arrives and then eases
      // from the old pose into the new one, instead of being taken down and rebuilt.
      picture = (
        <Suspense fallback={<p className="hand-model-wait">Loading the 3D hand…</p>}>
          <HandModelView
            letter={letter}
            pose={pose.pose}
            hand={hand}
            theme={shownTheme}
            numbers={handNumbers}
            fallback={drawing}
            onSettled={() => setModelSettled(true)}
            label={hideLetter ? 'A 3D hand making the letter to name. Grab it to turn it.' : undefined}
          />
        </Suspense>
      )
      tip = true
    }
  }

  const showsModel = view === '3d' && pose.status === 'ready'
  // Reset when the hand is taken out of the frame (2D chosen, or the next
  // letter's pose still arriving), so the next one starts as "loading" again.
  // (State set while rendering, which React allows for exactly this: it renders again at once.)
  if (!showsModel && modelSettled) setModelSettled(false)
  // The switch spins while 3D is chosen but its hand isn't up yet: the pose is
  // being fetched, or three.js and the hand model are still loading. A letter
  // with no 3D hand isn't loading anything.
  const loading3d = view === '3d' && (pose.status === 'loading' || (showsModel && !modelSettled))
  const frame = ['reference-image', 'reference-image-drawing', 'letter-picture', showsModel && 'hand-model-frame', className]
  return (
    <>
      <div className={frame.filter(Boolean).join(' ')}>
        <div className="picture-controls">
          <HandViewToggle loading={loading3d} />
          {showsModel && notes && (
            <button
              type="button"
              className="hand-numbers-toggle"
              aria-pressed={handNumbers}
              title="Show or hide the finger numbers"
              onClick={() => setHandNumbers(!handNumbers)}
            >
              Numbers
            </button>
          )}
        </div>
        {picture}
        {tip && notes && !turnTipClosed && (
          <div className="hand-model-tip on-dark" role="note">
            <span>Grab the hand to rotate it.</span>
            <button type="button" className="hand-model-tip-close" aria-label="Close this tip" onClick={closeTurnTip}>
              <CloseIcon size={12} />
            </button>
          </div>
        )}
        {corner && !large && <div className="picture-corner">{corner}</div>}
        {!large && (
          <button
            type="button"
            className="picture-expand"
            aria-label={hideLetter ? 'Show the picture larger' : `Show the ${letter} picture larger`}
            title="Show larger"
            onClick={() => setExpanded(true)}
          >
            <ExpandIcon />
          </button>
        )}
      </div>
      {expanded && (
        <PictureDialog title={hideLetter ? 'The handshape, larger' : `Letter ${letter}, larger`} onClose={() => setExpanded(false)}>
          <LetterPicture
            letter={letter}
            hand={hand}
            view={view}
            pose={pose}
            className="picture-dialog-frame"
            large
            hideLetter={hideLetter}
          />
        </PictureDialog>
      )}
    </>
  )
}
