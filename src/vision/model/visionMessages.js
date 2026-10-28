// Plain-language messages for loading and running the hand model, looked up
// by error name like the camera messages.

export const LOADING_HAND_MODEL = 'Loading hand model…'

const MESSAGES_BY_ERROR_NAME = {
  ModelMissingError:
    'The hand model file is missing, so hand tracking is off. It should be at public/models/hand_landmarker.task.',
  OfflineError:
    "Couldn't download the hand model. Check your connection, then reload the page.",
  WebGLUnavailableError:
    "Hand tracking needs WebGL, which this browser isn't providing. Turn on hardware acceleration in your browser's settings. If you can't, use a browser that supports WebGL.",
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

// What a camera view (CameraView) shows when hand tracking can't run.
// Without WebGL, the first fix is the browser's hardware acceleration setting
// (when it's off, some browsers give pages no WebGL); no browser is named
// (2026-10-29). Other failures show the title below with the plain message
// from getVisionErrorMessage.
export const CAMERA_VIEW_NO_WEBGL = {
  title: "Hand tracking can't run in this browser",
  body: "It needs WebGL, which this browser isn't giving to pages. Turn on hardware acceleration in your browser's settings. If you can't, use a browser that supports WebGL.",
}

export const CAMERA_VIEW_TRACKING_FAILED_TITLE = "Hand tracking couldn't start"
