import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import RecorderApp from './RecorderApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RecorderApp />
  </StrictMode>,
)
