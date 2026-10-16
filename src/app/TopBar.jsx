import Link from './Link.jsx'
import { PATHS } from './router.js'

// The thin bar at the top of every page: the wordmark and a quiet "Preview"
// (Sema's only preview signal) on the left, then what the page adds: the menu
// on the main pages (`nav`), and items on the right (`children`). Its colours
// come from the theme, or from the dark set inside an always-dark page.
export default function TopBar({ nav, children }) {
  return (
    <header className="app-bar">
      <div className="app-bar-left">
        <Link to={PATHS.welcome} className="wordmark">
          Sema
        </Link>
        <span className="preview-note">Preview</span>
        {nav}
      </div>
      {children && <div className="app-bar-right">{children}</div>}
    </header>
  )
}
