import { Suspense, lazy } from 'react'
import AslDrawing from '../../components/AslDrawing.jsx'

// Loaded only when a letter with a pose is shown in 3D, so a visitor who keeps
// the drawings never downloads three.js.
const HandModelView = lazy(() => import('../../hand-model/HandModelView.jsx'))

// The picture on Learn's letter card, by the 2D | 3D switch above it
// (2026-10-31): the letter's drawing, or the 3D hand making it, from its pose
// (`pose`, useLetterPose in LearnPage). With 3D chosen, a letter with no pose
// shows its drawing, with a line saying so (the switch's 3D is greyed out for
// it too). Both face the signing hand and sit in the same white 4:3 frame, so
// switching never moves the checklist.
export default function LetterPicture({ letter, hand, view, pose }) {
  const drawing = (
    <div className="reference-image reference-image-drawing">
      <AslDrawing letter={letter} hand={hand} alt={`Handshape for ${letter}`} />
    </div>
  )
  if (view !== '3d') return drawing

  // The first answer of the visit isn't in yet: an empty frame, for a moment.
  if (pose.status === 'loading') {
    return (
      <div className="reference-image reference-image-drawing hand-model-frame">
        <p className="hand-model-wait">Loading the 3D hand…</p>
      </div>
    )
  }
  // pose.letter can still be the previous letter for a moment, until this
  // one's answer arrives. A 3D hand stays up meanwhile and then eases from
  // the old pose into the new one, instead of being taken down and rebuilt.
  if (pose.status === 'unavailable') {
    return (
      <>
        {drawing}
        {pose.letter === letter && <p className="hand-model-note">No 3D hand for {letter} yet, so here&rsquo;s the drawing.</p>}
      </>
    )
  }
  return (
    <>
      <div className="reference-image reference-image-drawing hand-model-frame">
        <Suspense fallback={<p className="hand-model-wait">Loading the 3D hand…</p>}>
          <HandModelView letter={letter} pose={pose.pose} hand={hand} fallback={<AslDrawing letter={letter} hand={hand} />} />
        </Suspense>
      </div>
      <p className="hand-model-note">Drag the hand, or use ← →, to turn it.</p>
    </>
  )
}
