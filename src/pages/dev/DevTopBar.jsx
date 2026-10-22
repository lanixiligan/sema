import TopBar from '../../app/layout/TopBar.jsx'
import Link from '../../app/routing/Link.jsx'
import { PATHS } from '../../app/routing/router.js'

// The developer pages' top bar: "Developer tools", then the tool's name on a
// tool's page, where "Developer tools" links back to the dashboard.
export default function DevTopBar({ title }) {
  return (
    <TopBar>
      <nav className="dev-crumbs" aria-label="Developer tools">
        {title ? <Link to={PATHS.dev}>Developer tools</Link> : <span>Developer tools</span>}
        {title && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </>
        )}
      </nav>
    </TopBar>
  )
}
