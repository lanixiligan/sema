import { createContext, useContext } from 'react'

// The shared camera and hand model, filled in by CameraProvider. This is its
// own file because a component file should export only components (so React's
// Fast Refresh can reload it while you edit).
export const CameraContext = createContext(null)

export function useSharedCamera() {
  return useContext(CameraContext)
}
