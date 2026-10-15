import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

// Both are served by our own app from public/. BASE_URL keeps the paths right
// if the app is ever hosted in a subfolder (it's "/" by default).
const WASM_URL = `${import.meta.env.BASE_URL}mediapipe/wasm`
const MODEL_URL = `${import.meta.env.BASE_URL}models/hand_landmarker.task`

function namedError(name, message) {
  const error = new Error(message)
  error.name = name
  return error
}

// Downloads the model once and keeps the bytes, so falling back to the CPU
// or switching delegates doesn't download 7.5 MB again.
let modelBytesPromise = null

function loadModelBytes() {
  modelBytesPromise ??= fetchModel().catch((error) => {
    modelBytesPromise = null // let a later attempt try again
    throw error
  })
  return modelBytesPromise
}

async function fetchModel() {
  let response
  try {
    response = await fetch(MODEL_URL)
  } catch {
    // fetch only rejects when no answer came back at all: offline, or the
    // server is down.
    throw namedError('OfflineError', `Could not fetch ${MODEL_URL}`)
  }
  // Vite's dev server answers a request for a missing file with index.html
  // and status 200, so check the type as well as the status.
  const isWebPage = response.headers.get('content-type')?.includes('text/html')
  if (!response.ok || isWebPage) {
    throw namedError('ModelMissingError', `${MODEL_URL} not found`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

async function createHandLandmarker(delegate) {
  // Picks the right .wasm for this browser (with or without SIMD support).
  const wasmFiles = await FilesetResolver.forVisionTasks(WASM_URL)
  const modelBytes = await loadModelBytes()
  const landmarker = await HandLandmarker.createFromOptions(wasmFiles, {
    baseOptions: { modelAssetBuffer: modelBytes, delegate },
    runningMode: 'VIDEO', // frames of one continuous video, so it can track
    numHands: 1,
  })
  try {
    runTestFrame(landmarker)
  } catch (error) {
    landmarker.close()
    throw error
  }
  return landmarker
}

// Some problems only show up when the first frame is processed, not when the
// landmarker is created (for example a GPU missing a feature MediaPipe needs).
// Running one blank test frame finds them while we can still fall back, and
// gets the GPU's setup work done before the first real frame.
function runTestFrame(landmarker) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  canvas.getContext('2d').fillRect(0, 0, 64, 64)
  landmarker.detectForVideo(canvas, performance.now())
}

// Creates a HandLandmarker, trying the GPU first if asked. If the GPU can't
// be used (no WebGL2, missing GPU features, driver trouble), falls back to
// the CPU. Resolves to { landmarker, delegate, gpuFailed }.
export async function loadHandLandmarker(preferredDelegate) {
  if (preferredDelegate === 'GPU') {
    try {
      const landmarker = await createHandLandmarker('GPU')
      return { landmarker, delegate: 'GPU', gpuFailed: false }
    } catch (error) {
      // A missing or unreachable model would fail on the CPU too.
      if (error.name === 'ModelMissingError' || error.name === 'OfflineError') {
        throw error
      }
      console.warn('GPU delegate failed, falling back to CPU.', error)
    }
  }
  const landmarker = await createHandLandmarker('CPU')
  return { landmarker, delegate: 'CPU', gpuFailed: preferredDelegate === 'GPU' }
}
