// Plain-language messages for loading and running the hand model, looked up
// by error name like the camera messages.

export const LOADING_HAND_MODEL = 'Loading hand model…'

const MESSAGES_BY_ERROR_NAME = {
  ModelMissingError:
    'The hand model file is missing, so hand tracking is off. It should be at public/models/hand_landmarker.task.',
  OfflineError:
    "Couldn't download the hand model. Check your connection, then reload the page.",
  WebGLUnavailableError:
    "Hand tracking needs WebGL, which this browser isn't providing. Privacy-focused browsers such as LibreWolf often block it, so try Chrome or Firefox.",
}

export function getVisionErrorMessage(error) {
  const name = error?.name || 'UnknownError'
  return (
    MESSAGES_BY_ERROR_NAME[name] ??
    `Hand tracking couldn't start. Reload the page to try again. (${name})`
  )
}

export function getDetectionErrorMessage(error) {
  const name = error?.name || 'UnknownError'
  return `Hand tracking stopped unexpectedly. Reload the page to try again. (${name})`
}

// What the camera check (setup step 3) shows when hand tracking can't run.
// The WebGL text is from the design; other failures show the title below with
// the plain message from getVisionErrorMessage.
export const CAMERA_CHECK_NO_WEBGL = {
  title: "Hand tracking can't run in this browser",
  body: "It needs WebGL, which this browser isn't giving to pages. Open Sema in Chrome or Firefox.",
}

export const CAMERA_CHECK_TRACKING_FAILED_TITLE = "Hand tracking couldn't start"
