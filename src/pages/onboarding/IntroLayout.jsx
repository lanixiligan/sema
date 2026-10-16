import Link from '../../app/Link.jsx'
import TopBar from '../../app/TopBar.jsx'
import { ChevronIcon } from '../../components/icons.jsx'

// The frame the three intro pages share: a dark page, the top bar, the page's
// own items in the middle (revealed one by one), and Back and Skip intro at
// the bottom, visible from the start. Back is a link to `backTo`, a button
// that runs `onBack`, or absent. The middle comes first in the page, so the
// focus order is Continue, Back, Skip intro.
export default function IntroLayout({ reveal, backTo, onBack, skipTo, children }) {
  return (
    <div className="intro on-dark">
      <TopBar />
      <main className={`intro-main ${reveal.containerClass}`}>
        <div className="intro-stage">{children}</div>
        <div className="intro-footer">
          {backTo && (
            <Link to={backTo} className="text-link text-link-quiet">
              <ChevronIcon direction="left" />
              Back
            </Link>
          )}
          {onBack && (
            <button type="button" className="text-link text-link-quiet" onClick={onBack}>
              <ChevronIcon direction="left" />
              Back
            </button>
          )}
          {skipTo && (
            <Link to={skipTo} className="text-link text-link-quiet intro-skip">
              Skip intro
              <ChevronIcon />
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
