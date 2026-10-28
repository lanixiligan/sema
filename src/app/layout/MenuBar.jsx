import Link from '../routing/Link.jsx'
import { PATHS } from '../routing/router.js'
import TopBar from './TopBar.jsx'

const MENU = [
  { page: 'learn', label: 'Learn' },
  { page: 'quiz', label: 'Quiz' },
  { page: 'about', label: 'About' },
]

// The top bar on the main pages, with the menu, and on the right whatever the
// page passes in, then the theme toggle.
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
    </TopBar>
  )
}
