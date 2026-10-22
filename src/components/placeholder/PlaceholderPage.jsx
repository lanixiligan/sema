import MenuBar from '../../app/layout/MenuBar.jsx'

// A page that isn't available yet (Learn and Practice, until Phase 3): the
// usual menu, then one centred column with the page's own art and what's
// coming.
export default function PlaceholderPage({ active, art, title, children }) {
  return (
    <>
      <MenuBar active={active} />
      <main className="placeholder">
        <section>
          {art}
          <h1>{title}</h1>
          <p>{children}</p>
        </section>
      </main>
    </>
  )
}
