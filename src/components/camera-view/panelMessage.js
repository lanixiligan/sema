import { createContext } from 'react'

// What CameraPanel was given to say: { status, tone, hold, fill, extra }.
// CameraPanel provides it and StageMessage, on the video inside, shows it, so
// a page passes its message to the panel and never to the video itself.
export const PanelMessageContext = createContext(null)
