// Plain-language messages for everything that can go wrong with the camera.
// getUserMedia rejects with an error whose `name` says what happened, so we
// look the message up by that name.

const CAMERA_BUSY =
  'Your camera is busy or unavailable. Close other apps using it and try again.'

export const CAMERA_MESSAGES = {
  insecureContext: 'Open the app over HTTPS or localhost.',
  trackEnded:
    'The camera stopped. It may have been unplugged or taken by another app.',
}

const MESSAGES_BY_ERROR_NAME = {
  NotAllowedError:
    'Camera access is blocked. Allow it from the icon in the address bar.',
  NotFoundError: 'No camera found. Check it is plugged in.',
  NotReadableError: CAMERA_BUSY,
  // Firefox sometimes reports a camera it can't start (often one in use by
  // another app) as AbortError rather than NotReadableError.
  AbortError: CAMERA_BUSY,
}

// The kind of problem a getUserMedia error is, for pages that show their own
// title and text per kind (the camera check): 'blocked', 'busy', 'noCamera'
// or 'other'. useCamera adds 'insecure' and 'stopped' itself.
const KINDS_BY_ERROR_NAME = {
  NotAllowedError: 'blocked',
  NotReadableError: 'busy',
  AbortError: 'busy', // Firefox's busy camera, as above
  NotFoundError: 'noCamera',
}

export function cameraErrorKind(error) {
  return KINDS_BY_ERROR_NAME[error?.name] ?? 'other'
}

// What the camera check (setup step 3) shows for each kind, from the design.
// Kinds not listed show CAMERA_CHECK_OTHER with the plain message above.
export const CAMERA_CHECK_ERRORS = {
  blocked: {
    title: 'Camera access is blocked',
    body: 'Allow it from the camera icon in the address bar, then try again.',
  },
  busy: {
    title: 'Your camera is busy',
    body: 'Another app may be using it, like a video call. Close it and try again.',
  },
  noCamera: {
    title: 'No camera found',
    body: 'Check that a webcam is plugged in, then try again.',
  },
  stopped: {
    title: 'The camera stopped',
    body: "It may have been unplugged or taken by another app. Try again when it's back.",
  },
}

export const CAMERA_CHECK_OTHER_TITLE = "The camera didn't start"

export function getCameraErrorMessage(error) {
  const name = error?.name || 'UnknownError'
  return (
    MESSAGES_BY_ERROR_NAME[name] ??
    `Something went wrong starting the camera. Reload the page and try again. (${name})`
  )
}
