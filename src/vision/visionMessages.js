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
