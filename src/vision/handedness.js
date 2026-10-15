// Turns MediaPipe's handedness label ("Left" or "Right") into the hand the
// person actually raised.
//
// NOT VERIFIED YET: this passes MediaPipe's label through unchanged until it
// has been checked by holding up each hand in front of the camera.
export function toPhysicalHand(mediapipeLabel) {
  return mediapipeLabel
}
