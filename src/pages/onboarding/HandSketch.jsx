// A still hand drawn the way Sema draws a tracked hand (drawHand.js): bones
// over a dark outline, a dot on each of the 21 points. A picture on About
// Sema (AboutPreview.jsx), so screen readers skip it.

// Letter B, a right hand as it looks in the mirrored camera view: four
// fingers straight up and together, the thumb folded across the palm (its tip
// under the ring finger). The 21 points in MediaPipe's order (0 wrist,
// 1–4 thumb, 5–8 index, 9–12 middle, 13–16 ring, 17–20 pinky), in pixels of a
// 640×480 frame, like the video's own coordinates.
const HAND_B = [
  [320, 450],
  [278, 412], [255, 359], [282, 317], [345, 307],
  [252, 264], [242, 194], [238, 150], [236, 112],
  [302, 254], [300, 176], [297, 129], [297, 89],
  [352, 262], [356, 190], [358, 146], [361, 110],
  [398, 279], [409, 222], [414, 188], [418, 157],
]

// The bones, as pairs of points: the same pairs as MediaPipe's
// HAND_CONNECTIONS, which drawHand.js draws on the live video.
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
]

// One path through every bone, drawn twice: a wide dark outline, then the
// sky-blue bone on top. The widths are drawHand.js's, a third thicker: this
// frame is shown smaller than Record's, and that keeps them looking the same.
const bonePath = BONES.map(([a, b]) => `M${HAND_B[a]}L${HAND_B[b]}`).join('')

export default function HandSketch({ className = '' }) {
  return (
    <svg className={`hand-sketch ${className}`} viewBox="0 0 640 480" aria-hidden="true">
      <path d={bonePath} className="hand-sketch-outline" />
      <path d={bonePath} className="hand-sketch-bones" />
      {HAND_B.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5.5" className="hand-sketch-joint" />
      ))}
    </svg>
  )
}
