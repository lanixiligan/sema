// The ASL letter drawings in public/images/asl/ (WPClipart, public domain;
// docs/ATTRIBUTION.md) show a left hand, so a drawing is mirrored to show the
// right. They're black lines: whatever holds one gives it a white backing in
// both themes, or a dark card would swallow them.
export const DRAWN_HAND = 'left'

// letter: 'A' to 'Z'. hand: 'left' or 'right', the hand the drawing shows.
// Decorative by default (alt ""): it always sits next to its letter.
export default function AslDrawing({ letter, hand, alt = '' }) {
  return (
    <img
      className={hand === DRAWN_HAND ? 'asl-drawing' : 'asl-drawing mirrored'}
      src={`${import.meta.env.BASE_URL}images/asl/${letter.toLowerCase()}.svg`}
      alt={alt}
    />
  )
}
