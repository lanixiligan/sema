import Link from './Link.jsx'
import { PATHS } from './router.js'
import SettingsMenu from './SettingsMenu.jsx'
import TopBar from './TopBar.jsx'

const MENU = [
  { page: 'record', label: 'Record' },
  { page: 'learn', label: 'Learn' },
  { page: 'practice', label: 'Practice' },
]

// The top bar on the main pages, with the menu, and on the right whatever the
// page passes in (Record shows its session there), then the settings menu.
// The current page's link gets aria-current="page": screen readers announce
// it as the current page, and the CSS underlines it.
export default function MenuBar({ active, children }) {
  return (
    <TopBar
      nav={
        <nav aria-label="Main" className="menu">
          {MENU.map((item) => (
            <Link
              key={item.page}
              to={PATHS[item.page]}
              aria-current={item.page === active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      }
    >
      {children}
      <SettingsMenu />
    </TopBar>
  )
}
