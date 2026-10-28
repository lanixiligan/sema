import TopBar from '../../app/layout/TopBar.jsx'
import Link from '../../app/routing/Link.jsx'
import { PATHS } from '../../app/routing/router.js'
import AslDrawing, { DRAWN_HAND } from '../../components/AslDrawing.jsx'

// The page spells its own mood in ASL, one tile per letter.
const WORD = ['L', 'O', 'S', 'T']

// Shown for an address Sema never had, such as a typo in a link (router.js:
// 'notFound', a page with no address of its own; until 2026-10-29 these
// quietly went to Welcome). One way out, to the start: '/' already sends a
// returning visitor on to Learn. The server still answers these addresses
// with status 200, since every path gets index.html (vercel.json) and only the
// app, once it runs, knows which pages exist.
export default function NotFoundPage() {
  return (
    <>
      <TopBar />
      <main className="placeholder not-found">
        <section>
          <ul className="not-found-word" aria-label={`Fingerspelled: ${WORD.join(', ')}`}>
            {WORD.map((letter) => (
              <li key={letter}>
                <span className="not-found-tile">
                  <AslDrawing letter={letter} hand={DRAWN_HAND} />
                </span>
                <span className="not-found-letter" aria-hidden="true">
                  {letter}
                </span>
              </li>
            ))}
          </ul>
          <h1>Page not found</h1>
          <p>There&rsquo;s nothing at this address. The link may have a typo, or the page may have moved.</p>
          <Link to={PATHS.welcome} className="primary-button">
            Go to Sema
          </Link>
        </section>
      </main>
    </>
  )
}
