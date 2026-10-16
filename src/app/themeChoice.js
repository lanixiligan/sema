import { createContext, useContext } from 'react'

// The theme choice and the function that changes it, for the settings menu.
// App holds the setting (with the others) and provides it here. A context
// lets the menu read it without every page passing it along as a prop.
export const ThemeChoiceContext = createContext(null)

export function useThemeChoice() {
  return useContext(ThemeChoiceContext)
}
