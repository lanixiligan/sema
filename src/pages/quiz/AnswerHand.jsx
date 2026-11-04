import { Suspense, lazy, useState } from 'react'
import AslDrawing from '../../components/AslDrawing.jsx'
import { CheckIcon, CloseIcon, ExpandIcon } from '../../components/icons/icons.jsx'
import LetterPicture from '../../components/letter-picture/LetterPicture.jsx'
import PictureDialog from '../../components/letter-picture/PictureDialog.jsx'
import { useSettings } from '../../app/settings/settings.js'
import { useLetterPose } from '../../hand-model/letterPoses.js'

// Loaded only when a 3D hand is shown, as in LetterPicture.
const HandModelView = lazy(() => import('../../hand-model/HandModelView.jsx'))

// A card with a status tag on top ("Correct answer" or "You guessed"), the hand picture and its letter underneath, shown in place of the sign after
// a wrong answer (Guess the letter): `kind` 'right' is the letter that was
// asked (green, like its tile), 'wrong' the one picked (amber), so the two
// handshapes can be compared side by side. It follows the 2D | 3D choice
// (`view`); a letter with no 3D hand yet, or one still loading, shows its
// drawing (below). In the light theme the picture is white whether it's the drawing or the 3D hand (2026-11-04), in Deep Sky; in the dark theme (2026-11-04) it's Deep Cobalt all through, the drawing
// in white lines (the 3D hand in Bright Sky), and the letter strip below is the card's solid colour with a white letter. The picture, tag and letter are decorative for a
// screen reader (the feedback line already says "It's D. You picked I."); the one
// thing left is the expand button in the picture's lower right corner (2026-11-04),
// which shows the hand large in a window (PictureDialog, as on every other picture
// of a hand), where the 2D | 3D switch works too.
export default function AnswerHand({ letter, kind, hand, view }) {
  const pose = useLetterPose(letter)
  const { shownTheme, handNumbers } = useSettings()
  const [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // pose.letter can still be the previous letter's for a moment.
  const show3d = view === '3d' && pose.status === 'ready' && pose.letter === letter
  // When the 3D hand leaves the card (2D chosen), it's no longer ready: switching
  // back to 3D loads a new one, and the drawing must stay until that one is in.
  // (State set while rendering, as in LetterPicture: React renders again at once.)
  if (!show3d && ready) setReady(false)

  // The drawing is always there; the 3D hand loads over it (a WebGL view, the
  // model and its pose take a moment) and fades in when it's ready, so the card
  // is never empty and the hand doesn't pop in from nothing.
  return (
    <figure className={`guess-compare is-${kind}`}>
      {/* Who this hand is, on top: the answer, or the letter that was picked. */}
      <p className="guess-compare-tag" aria-hidden="true">
        {kind === 'right' ? <CheckIcon size={20} strokeWidth={2.8} /> : <CloseIcon size={14} />}
        {kind === 'right' ? 'Correct answer' : 'You guessed'}
      </p>
      <div className={`guess-compare-picture${show3d && ready ? ' is-3d-ready' : ''}`}>
        <div className="guess-compare-drawing" aria-hidden="true">
          <AslDrawing letter={letter} hand={hand} />
        </div>
        {show3d && (
          <div className="guess-compare-3d" aria-hidden="true">
            <Suspense fallback={null}>
              <HandModelView
                letter={letter}
                pose={pose.pose}
                hand={hand}
                theme={shownTheme}
                numbers={handNumbers}
                instant
                fallback={null}
                onReady={() => setReady(true)}
              />
            </Suspense>
          </div>
        )}
        <button
          type="button"
          className="picture-expand"
          aria-label={`Show the ${letter} hand larger`}
          title="Show larger"
          onClick={() => setExpanded(true)}
        >
          <ExpandIcon />
        </button>
      </div>
      <figcaption className="guess-compare-letter" aria-hidden="true">
        {letter}
      </figcaption>
      {expanded && (
        <PictureDialog title={`Letter ${letter}, larger`} onClose={() => setExpanded(false)}>
          <LetterPicture letter={letter} hand={hand} view={view} pose={pose} className="picture-dialog-frame" large />
        </PictureDialog>
      )}
    </figure>
  )
}
