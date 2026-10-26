import { pathUpTo } from '../../vision/landmarks/zTrace.js'

// The colours are styles.css's tokens, read once (a canvas can't use CSS
// variables): the line to trace in see-through Cloud White, the traced part in
// Bright Sky, with the hand drawing's dark outline under both.
let colors = null

function traceColors(canvas) {
  if (!colors) {
    const css = getComputedStyle(canvas)
    colors = {
      traced: css.getPropertyValue('--bright-sky').trim(),
      guide: css.getPropertyValue('--cloud-white').trim(),
      outline: css.getPropertyValue('--hand-outline').trim(),
    }
  }
  return colors
}

// Draws the Z (path, in frame heights: zTrace.js) with the part up to `along`
// filled in, a dot (1) where it starts and a ring (2) where it ends. Like drawHand.js, in the un-mirrored
// video's pixels on a canvas mirrored by CSS.
export function drawTrace(canvas, path, along, videoWidth, videoHeight) {
  const pixelRatio = window.devicePixelRatio || 1
  const width = Math.round(videoWidth * pixelRatio)
  const height = Math.round(videoHeight * pixelRatio)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, videoWidth, videoHeight)

  // Frame heights to pixels: both x and y times the video's height.
  const toPixels = (points) => points.map((p) => ({ x: p.x * videoHeight, y: p.y * videoHeight }))
  const unit = videoWidth / 640
  const { traced, guide, outline } = traceColors(canvas)

  const line = toPixels(path)
  stroke(ctx, line, outline, 12 * unit, 0.6)
  stroke(ctx, line, guide, 7 * unit, 0.55)
  if (along !== null && along > 0) stroke(ctx, toPixels(pathUpTo(path, along)), traced, 7 * unit, 1)

  ctx.globalAlpha = 1
  // Point 2, a ring: reaching it finishes the Z.
  const end = line.at(-1)
  ring(ctx, end, 15 * unit, outline, 9 * unit)
  ring(ctx, end, 15 * unit, guide, 4 * unit)
  number(ctx, '2', end, 15 * unit, guide, outline)

  // Point 1, the dot to start on: filled in once the trace has started.
  const [start] = line
  ctx.beginPath()
  ctx.arc(start.x, start.y, 15 * unit, 0, Math.PI * 2)
  ctx.fillStyle = along === null ? guide : traced
  ctx.fill()
  ctx.lineWidth = 3 * unit
  ctx.strokeStyle = outline
  ctx.stroke()
  number(ctx, '1', start, 15 * unit, outline, null)
}

function ring(ctx, center, radius, color, lineWidth) {
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

// A number in the middle of a point. The canvas is mirrored by CSS like the
// video, so the text is flipped back first, or it would read backwards.
function number(ctx, text, center, radius, color, outline) {
  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.scale(-1, 1)
  ctx.font = `800 ${Math.round(radius * 1.2)}px "Plus Jakarta Sans", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (outline) {
    ctx.lineWidth = radius * 0.3
    ctx.strokeStyle = outline
    ctx.strokeText(text, 0, 1)
  }
  ctx.fillStyle = color
  ctx.fillText(text, 0, 1)
  ctx.restore()
}

function stroke(ctx, points, color, lineWidth, alpha) {
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.stroke()
}
