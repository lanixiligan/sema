import PlaceholderPage from '../../components/placeholder/PlaceholderPage.jsx'
import { mixLetters } from '../../components/placeholder/mixLetters.js'
import { useLetters } from '../../recorder/letters.js'

// Learn, until the lessons arrive (Phase 3.3). The art is the same staggered
// row of the training letters in mixed order as on Practice.
export default function LearnPage() {
  const letters = useLetters()

  return (
    <PlaceholderPage
      active="learn"
      title="Learn is on its way"
      art={
        // The row keeps its height while letters.json loads, so nothing jumps.
        <div className="placeholder-tiles" aria-hidden="true">
          {mixLetters(letters.training).map((letter) => (
            <span key={letter}>{letter}</span>
          ))}
        </div>
      }
    >
    </PlaceholderPage>
  )
}
