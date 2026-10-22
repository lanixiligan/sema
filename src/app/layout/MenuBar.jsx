import Link from '../routing/Link.jsx'
import { PATHS } from '../routing/router.js'
import SettingsMenu from '../settings/SettingsMenu.jsx'
import TopBar from './TopBar.jsx'

const MENU = [
  { page: 'try', label: 'Try' },
  { page: 'learn', label: 'Learn' },
  { page: 'practice', label: 'Practice' },
]

// The top bar on the main pages, with the menu, and on the right whatever the
// page passes in, the theme toggle, and the settings menu last.
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
      end={<SettingsMenu />}
    >
      {children}
    </TopBar>
  )
}
