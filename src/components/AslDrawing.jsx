import { useSettings } from '../app/settings/settings.js'

// The ASL letter drawings in public/images/asl/ (WPClipart, public domain;
// docs/ATTRIBUTION.md) show a left hand, so a drawing is mirrored to show the
// right. They are single-colour line drawings, and an <img> can't read CSS
// variables, so each letter has two files (2026-11-04; before, black lines on a
// white sticker in both themes): Deep Sky for light surfaces
// (images/asl/a.svg) and Bright Sky for dark ones (images/asl/dark/a.svg). In
// the dark theme a CSS filter then turns the lines white (`is-white`, below),
// so the Bright Sky doesn't show. The drawing follows the theme on screen.
export const DRAWN_HAND = 'left'

// letter: 'A' to 'Z'. hand: 'left' or 'right', the hand the drawing shows.
// onWhite: the card behind it is white in both themes (About's card, Page not
// found, Record), so it keeps the light theme's colour even in the dark one.
// Decorative by default (alt ""): it always sits next to its letter.
export default function AslDrawing({ letter, hand, alt = '', onWhite = false }) {
  const settings = useSettings()
  const dark = settings?.shownTheme === 'dark' && !onWhite
  const folder = dark ? 'images/asl/dark' : 'images/asl'
  // In the dark theme every drawing is white (2026-11-04; before, Bright Sky,
  // and only on the quiz's compare cards): the `is-white` class turns the lines white in CSS.
  // Z's drawing has the Z itself in it, so it is flipped the other way round
  // (2026-11-07): it must read like the Z the camera asks the person to trace.
  const mirrored = (hand !== DRAWN_HAND) !== (letter === 'Z')
  const classes = ['asl-drawing', mirrored && 'mirrored', dark && 'is-white']
  return (
    <img
      className={classes.filter(Boolean).join(' ')}
      src={`${import.meta.env.BASE_URL}${folder}/${letter.toLowerCase()}.svg`}
      alt={alt}
    />
  )
}
