import { FINGER_NUMBERS } from '../vision/landmarks/handPoints.js'

// A sentence about fingers, with every {finger} as its number in a badge and
// its name in bold: "{thumb} tucked in" shows as "(1) thumb tucked in". The
// numbers are the ones on the fingertips, 1 thumb to 5 pinky (handPoints.js).
// Used by Learn's finger checklist and the Handshapes page's steps (2026-11-14;
// before, inside pages/learn/FingerChecklist.jsx).
export default function FingerText({ text }) {
  return text.split(/\{(\w+)\}/).map((part, i) =>
    // split puts the names in braces at the odd places.
    i % 2 === 1 ? (
      <b key={i} className="finger-name">
        <span className="finger-badge" aria-hidden="true">
          {FINGER_NUMBERS[part]}
        </span>
        {part}
      </b>
    ) : (
      part
    ),
  )
}
