import { useEffect, useRef, useState } from 'react'
import { loadHandLandmarker } from './loadHandLandmarker.js'
import { getVisionErrorMessage } from './visionMessages.js'

// Owns the MediaPipe HandLandmarker: creates it the first time the camera
// starts, recreates it when the preferred delegate changes, and closes it on
// unmount.
export function useHandLandmarker(isCameraLive, preferredDelegate) {
  // The detection loop reads this on every frame. Cleanup sets it to null
  // *before* calling close(), so the loop never uses a closed landmarker.
  const landmarkerRef = useRef(null)
  // The outcome of the current load: { delegate, gpuFailed } or { error }.
  // null while nothing has finished loading.
  const [loaded, setLoaded] = useState(null)

  // Nothing is downloaded on page load: wait for the camera's first start,
  // then keep the model loaded even if the camera is stopped.
  // Setting state while rendering is fine for remembering a change in props
  // like this; React re-renders straight away, before showing anything.
  const [hasCameraStarted, setHasCameraStarted] = useState(false)
  if (isCameraLive && !hasCameraStarted) setHasCameraStarted(true)

  useEffect(() => {
    if (!hasCameraStarted) return
    let cancelled = false
    let landmarker = null

    loadHandLandmarker(preferredDelegate).then(
      (result) => {
        if (cancelled) {
          // We unmounted, or the delegate changed, while it was loading.
          result.landmarker.close()
          return
        }
        landmarker = result.landmarker
        landmarkerRef.current = landmarker
        setLoaded({ delegate: result.delegate, gpuFailed: result.gpuFailed })
      },
      (error) => {
        if (cancelled) return
        console.error('Hand model failed to load.', error)
        setLoaded({ error: getVisionErrorMessage(error) })
      },
    )

    return () => {
      cancelled = true
      landmarkerRef.current = null
      landmarker?.close() // frees its WebAssembly memory and GPU resources
      setLoaded(null)
    }
  }, [hasCameraStarted, preferredDelegate])

  let status = 'idle'
  if (hasCameraStarted) {
    if (!loaded) status = 'loading'
    else status = loaded.error ? 'error' : 'ready'
  }

  return {
    landmarkerRef,
    status, // 'idle' | 'loading' | 'ready' | 'error'
    error: loaded?.error ?? null,
    delegate: loaded?.delegate ?? null, // the one actually in use
    gpuFailed: loaded?.gpuFailed ?? false,
  }
}
