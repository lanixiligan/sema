import TopBar from '../../app/TopBar.jsx'
import StepNav from './StepNav.jsx'

// The frame the three intro pages share: the top bar, the page's own items
// in the middle (revealed one by one), and Previous and Next along the
// bottom, there from the start. `previous` and `next` are StepNav's: a link
// ({ to }) or a button ({ onClick }), or absent.
export default function IntroLayout({ reveal, previous, next, children }) {
  return (
    <div className="intro">
      <TopBar />
      <main className={`intro-main ${reveal.containerClass}`}>{children}</main>
      <StepNav previous={previous} next={next} />
    </div>
  )
}
