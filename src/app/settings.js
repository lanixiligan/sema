import { createContext, useContext } from 'react'

// What the top bar's controls need from the settings App holds: the theme
// choice and the function that changes it (ThemeToggle), and the function
// that deletes everything Sema saved (SettingsMenu). A context lets them read
// it without every page passing it along as a prop.
export const SettingsContext = createContext(null)

export function useSettings() {
  return useContext(SettingsContext)
}
