import { HandLandmarker } from '@mediapipe/tasks-vision'

// The colours are the CSS tokens in styles.css (--bright-sky bones,
// --cloud-white joints, --hand-outline under both, which keeps the skeleton
// visible over any background or skin tone). A canvas can't use CSS variables
// directly, so they're read from the stylesheet once, on the first drawing.
let colors = null

function handColors(canvas) {
  if (!colors) {
    const css = getComputedStyle(canvas)
    colors = {
      bone: css.getPropertyValue('--bright-sky').trim(),
      joint: css.getPropertyValue('--cloud-white').trim(),
      outline: css.getPropertyValue('--hand-outline').trim(),
    }
  }
  return colors
}

// Draws one hand's 21 landmarks and the bones between them.
export function drawHand(canvas, landmarks, videoWidth, videoHeight) {
  drawHands(canvas, [landmarks], videoWidth, videoHeight)
}

// Draws several hands (a list of landmark lists), replacing what was drawn.
// The canvas is mirrored by CSS exactly like the video, so we draw in the
// video's own (un-mirrored) coordinates and the browser flips both together.
export function drawHands(canvas, hands, videoWidth, videoHeight) {
  // Give the canvas one pixel per screen pixel: the video's real resolution
  // times devicePixelRatio (2 on most HiDPI screens). Otherwise the browser
  // stretches it and the lines blur. Changing the size also clears it.
  const pixelRatio = window.devicePixelRatio || 1
  const width = Math.round(videoWidth * pixelRatio)
  const height = Math.round(videoHeight * pixelRatio)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')
  // From here on, draw in video pixels; the transform scales up to canvas pixels.
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, videoWidth, videoHeight)
  for (const landmarks of hands) drawOneHand(ctx, canvas, landmarks, videoWidth, videoHeight)
}

function drawOneHand(ctx, canvas, landmarks, videoWidth, videoHeight) {
  // Landmarks are normalized: x and y run from 0 to 1 across the frame,
  // whatever its size. Multiply by the frame size to get pixels. Points
  // outside the frame (below 0 or above 1) land off the canvas and are cut off.
  const points = landmarks.map((point) => ({
    x: point.x * videoWidth,
    y: point.y * videoHeight,
  }))

  // Keep lines the same thickness on screen at any camera resolution.
  const unit = videoWidth / 640

  // All outlines first, then all bones, so no outline cuts across a bone.
  const { bone, joint, outline } = handColors(canvas)
  strokeBones(ctx, points, outline, 6 * unit)
  strokeBones(ctx, points, bone, 3 * unit)

  ctx.fillStyle = joint
  ctx.strokeStyle = outline
  ctx.lineWidth = 1.5 * unit
  for (const point of points) {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4 * unit, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

function strokeBones(ctx, points, color, lineWidth) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.beginPath()
  // HAND_CONNECTIONS lists the bones as pairs of landmark indexes,
  // e.g. { start: 0, end: 1 } is wrist to thumb base.
  for (const { start, end } of HandLandmarker.HAND_CONNECTIONS) {
    ctx.moveTo(points[start].x, points[start].y)
    ctx.lineTo(points[end].x, points[end].y)
  }
  ctx.stroke()
}

export function clearHand(canvas) {
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}
