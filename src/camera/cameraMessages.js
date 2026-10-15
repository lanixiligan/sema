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

export function getCameraErrorMessage(error) {
  const name = error?.name || 'UnknownError'
  return (
    MESSAGES_BY_ERROR_NAME[name] ??
    `Something went wrong starting the camera. Reload the page and try again. (${name})`
  )
}
