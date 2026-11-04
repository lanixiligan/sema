import { createContext, useContext } from 'react'

// What controls need from the settings App holds: the theme on screen and the
// function that changes the choice (ThemeToggle, in the top bar), the hand
// picture, '2d' or '3d', and its setter (HandViewToggle, on every picture
// of a hand), whether the 3D hand's "drag to turn it" tip was closed and the
// function that closes it (the tip, in LetterPicture), whether the 3D hand's
// fingertip numbers show and its setter (the Numbers button, in LetterPicture),
// the order of Guess the letter's keys, 'alphabet' or 'keyboard', and its setter
// (KeyLayoutToggle), and the function
// that deletes everything Sema saved (DeleteDataButton, on the developer
// dashboard). A context lets them read it without every page passing it along
// as a prop.
export const SettingsContext = createContext(null)

export function useSettings() {
  return useContext(SettingsContext)
}
