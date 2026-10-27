// MediaPipe's 21 hand points, by number: the wrist (0), then 4 points per
// finger, from its base knuckle out to its tip (the thumb's base is near the
// wrist). Every file that picks a point by number takes it from here.
export const WRIST = 0
export const FINGERS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
}

// The four fingers without the thumb.
export const FOUR_FINGERS = ['index', 'middle', 'ring', 'pinky']

// Each finger's tip, its last point: TIPS.index is 8.
export const TIPS = Object.fromEntries(Object.entries(FINGERS).map(([finger, points]) => [finger, points.at(-1)]))

// Each finger's number, 1 for the thumb to 5 for the pinky, as in piano
// fingering. The hand drawing (drawHand.js) puts it on the fingertip and
// Learn's checklist shows it beside the finger's name, so a line such as
// "2 index folded down" points at a finger on the camera.
export const FINGER_NUMBERS = { thumb: 1, index: 2, middle: 3, ring: 4, pinky: 5 }
