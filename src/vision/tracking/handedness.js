// Turns MediaPipe's handedness label ("Left" or "Right") into the hand the
// person actually raised.
//
// Rule, checked by holding up each hand on 2026-10-15 (Chrome,
// @mediapipe/tasks-vision 1.1.1): we give MediaPipe the camera's frames as
// they are, NOT mirrored (only the display is mirrored, with CSS). For those
// frames MediaPipe's label already names the physical hand: raising your right
// hand gives "Right". So the label passes through unchanged. (Older MediaPipe
// docs said the label assumes a mirrored image; that's not what we observed.)
//
// If frames are ever mirrored before detection, the label will swap and this
// must swap too. Re-check after upgrading MediaPipe.
export function toPhysicalHand(mediapipeLabel) {
  return mediapipeLabel
}
