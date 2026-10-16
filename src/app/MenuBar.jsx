import Link from './Link.jsx'
import PreviewPill from './PreviewPill.jsx'
import { PATHS } from './router.js'

const MENU = [
  { page: 'record', label: 'Record' },
  { page: 'learn', label: 'Learn', preview: true },
  { page: 'practice', label: 'Practice', preview: true },
]

// The top bar on the main pages: Sema with its Preview pill, the menu, and on
// the right whatever the page passes in (Record shows its session there).
// The current page's link gets aria-current="page": screen readers announce
// it as the current page, and the CSS underlines it.
export default function MenuBar({ active, children }) {
  return (
    <header className="menu-bar">
      <div className="menu-bar-left">
        <div className="brand">
          <Link to={PATHS.welcome} className="brand-name">
            Sema
          </Link>
          <PreviewPill />
        </div>
        <nav aria-label="Main" className="menu">
          {MENU.map((item) => (
            <Link
              key={item.page}
              to={PATHS[item.page]}
              aria-current={item.page === active ? 'page' : undefined}
            >
              {item.label}
              {item.preview && <PreviewPill inMenu />}
            </Link>
          ))}
        </nav>
      </div>
      <div className="menu-bar-status">{children}</div>
    </header>
  )
}
