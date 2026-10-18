import PlaceholderPage from '../../components/PlaceholderPage.jsx'
import { useLetters } from '../../recorder/letters.js'
import { mixLetters } from '../../components/mixLetters.js'

// Practice, until it arrives after Learn (Phase 3.4). The art is a staggered
// row of the training letters in mixed order, because practice mixes letters.
export default function PracticePage() {
  const letters = useLetters()

  return (
    <PlaceholderPage
      active="practice"
      title="Practice is on its way"
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
