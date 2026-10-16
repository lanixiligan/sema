import Link from '../app/Link.jsx'
import MenuBar from '../app/MenuBar.jsx'
import { PATHS } from '../app/router.js'

// A page that isn't available yet (Learn and Practice, until Phase 3): the
// usual menu, then one centred column with the page's own art, what's coming,
// and the most useful thing to do now, which is recording.
export default function PlaceholderPage({ active, art, title, children }) {
  return (
    <>
      <MenuBar active={active} />
      <main className="placeholder">
        <section>
          {art}
          <h1>{title}</h1>
          <p>{children}</p>
          <Link to={PATHS.record} className="primary-button">
            Go to Record
          </Link>
        </section>
      </main>
    </>
  )
}
