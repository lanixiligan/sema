import HandSketch from './HandSketch.jsx'

// About Sema's picture: one panel built from the Record page's parts. On top,
// the camera frame with a hand drawn as Sema draws it, labelled "Handshape
// preview"; under a thin line, the letter it shows. It shows what the text beside it says
// (a letter, your hand at the camera), so screen readers skip it.

export default function AboutPreview({ className = '' }) {
  return (
    <div className={`about-preview ${className}`} aria-hidden="true">
      <div className="stage about-preview-frame">
        <HandSketch className="about-preview-hand" />
        <div className="take-overlay">
          <div className="take-overlay-bar">
            <span className="take-overlay-phase">Handshape preview</span>
          </div>
        </div>
      </div>
      <div className="about-preview-letter">
        <div className="letter-tile">B</div>
        <div className="letter-card-text">
          <div className="letter-card-title">Letter B</div>
          <div className="letter-card-instructions">
            Flat hand, four fingers straight up and together, thumb folded across the palm.
          </div>
        </div>
      </div>
    </div>
  )
}
