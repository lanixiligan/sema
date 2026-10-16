import { useCallback, useEffect, useRef, useState } from 'react'
import { CAMERA_MESSAGES, cameraErrorKind, getCameraErrorMessage } from './cameraMessages.js'

// What we ask the browser for. `ideal` values are preferences: the browser
// picks the closest thing the camera supports instead of failing, so 640×480
// is a request, not a promise.
function buildConstraints(deviceId) {
  const video = { width: { ideal: 640 }, height: { ideal: 480 } }
  if (deviceId) {
    // `exact` is a hard requirement: if this camera has gone away,
    // getUserMedia fails with OverconstrainedError instead of picking another.
    video.deviceId = { exact: deviceId }
  } else {
    video.facingMode = 'user' // the front ("selfie") camera, where there is one
  }
  return { video, audio: false }
}

async function openCamera(deviceId) {
  try {
    return await navigator.mediaDevices.getUserMedia(buildConstraints(deviceId))
  } catch (error) {
    if (error.name !== 'OverconstrainedError') throw error
    // A hard requirement couldn't be met (usually the chosen camera was
    // unplugged). Try again asking for any camera at all.
    console.warn(
      `Camera constraint "${error.constraint}" could not be met. Retrying with { video: true }.`,
    )
    return navigator.mediaDevices.getUserMedia({ video: true })
  }
}

// Stopping every track is what releases the camera and turns its light off.
// Dropping the stream or clearing the <video> is not enough.
function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

// Camera names are blank until the page has camera permission.
async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

export function useCamera() {
  const videoRef = useRef(null)
  // The live MediaStream. A ref rather than state: it's a handle to hardware
  // that cleanup code must reach, and swapping it shouldn't cause a render.
  const streamRef = useRef(null)
  // Bumped on every start, stop and unmount. A getUserMedia call that finishes
  // after the number has moved on is out of date, and its stream is stopped.
  const requestIdRef = useRef(0)

  // A callback ref for the <video> on screen. React calls it with the element
  // when a page shows its video, and with null when that page goes away.
  // Giving a new element the running stream lets the picture carry on from one
  // page to the next. useCallback keeps it the same function between
  // renders, so React doesn't detach and re-attach it every time.
  const attachVideo = useCallback((video) => {
    videoRef.current = video
    if (video && video.srcObject !== streamRef.current) video.srcObject = streamRef.current
  }, [])

  const [status, setStatus] = useState('idle') // 'idle' | 'starting' | 'live'
  // What went wrong, if anything: the plain-language message, and its kind
  // ('blocked', 'busy', 'noCamera', 'insecure', 'stopped' or 'other') for pages
  // that show their own text per kind.
  const [failure, setFailure] = useState(null)
  const [cameras, setCameras] = useState([])
  const [deviceId, setDeviceId] = useState(null)

  function releaseCamera() {
    stopTracks(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  async function startCamera(nextDeviceId) {
    requestIdRef.current += 1
    const requestId = requestIdRef.current
    releaseCamera() // free the current camera before opening the next one
    setFailure(null)

    // Browsers only offer the camera to secure pages (https:// or localhost).
    // Elsewhere navigator.mediaDevices is simply missing.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('idle')
      setFailure({ message: CAMERA_MESSAGES.insecureContext, kind: 'insecure' })
      return
    }

    setStatus('starting')
    let stream
    try {
      stream = await openCamera(nextDeviceId)
    } catch (err) {
      if (requestId !== requestIdRef.current) return // superseded: stay quiet
      setStatus('idle')
      setFailure({ message: getCameraErrorMessage(err), kind: cameraErrorKind(err) })
      return
    }

    if (requestId !== requestIdRef.current) {
      // Stop was pressed, another camera was picked, or the component
      // unmounted while we waited for permission. Don't leave the light on.
      stopTracks(stream)
      return
    }

    streamRef.current = stream
    // The page's video may not be on screen yet; attachVideo hands it the
    // stream when it is.
    if (videoRef.current) videoRef.current.srcObject = stream

    const [track] = stream.getVideoTracks()
    // 'ended' fires when the track stops for a reason other than our own
    // track.stop(): the camera was unplugged, or the system took it away.
    track.addEventListener('ended', () => {
      if (streamRef.current !== stream) return // an old stream we replaced
      releaseCamera()
      setStatus('idle')
      setFailure({ message: CAMERA_MESSAGES.trackEnded, kind: 'stopped' })
    })

    setDeviceId(track.getSettings().deviceId ?? null)
    setStatus('live')
    setCameras(await listCameras()) // we have permission now, so names show
  }

  function stop() {
    requestIdRef.current += 1 // cancels a start still waiting on the prompt
    releaseCamera()
    setStatus('idle')
  }

  // Keep the camera list current when cameras are plugged in or removed.
  useEffect(() => {
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices) return // insecure context: startCamera explains why

    function handleDeviceChange() {
      listCameras().then(setCameras)
    }
    mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () =>
      mediaDevices.removeEventListener('devicechange', handleDeviceChange)
  }, [])

  // Release the camera when the component using this hook unmounts.
  // In development, StrictMode runs this once straight after the first mount
  // (mount, unmount, mount again). The camera isn't open yet then, so that's
  // harmless. Vite's hot reload also re-runs it when you edit code while the
  // camera is on, hence resetting the status. videoRef is already null by the
  // time this runs on unmount, which is why the stream has its own ref.
  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      stopTracks(streamRef.current)
      streamRef.current = null
      setStatus('idle')
    }
  }, [])

  return {
    videoRef,
    attachVideo,
    status,
    error: failure?.message ?? null,
    errorKind: failure?.kind ?? null,
    cameras,
    deviceId,
    start: () => startCamera(deviceId), // reuse the last camera, if any
    switchCamera: (id) => startCamera(id),
    stop,
  }
}
