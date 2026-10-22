import { useId } from 'react'
import Link from '../../app/routing/Link.jsx'
import { PATHS } from '../../app/routing/router.js'
import DevTopBar from './DevTopBar.jsx'
// The latest training runs' headline numbers: step 5's small model
// (training/train_small.py) and step 4's k-NN (training/train.py).
import smallResults from '../../../training/reports/small.json'
import knnResults from '../../../training/reports/knn.json'

const TOOLS = [
  {
    to: PATHS.devTracking,
    title: 'Tracking and benchmark',
    about: 'Camera and hand-tracking readouts, the GPU or CPU choice, and the speed benchmark (Phase 1).',
  },
  {
    to: PATHS.devRecord,
    title: 'Record',
    about: 'Records takes of each letter as hand points, for the test set, and downloads the session file.',
  },
  {
    to: PATHS.devExtract,
    title: 'Extract hand points',
    about: 'Runs a public dataset’s photos (ASL-HG, ASLYset) through Sema’s hand model and normalization. Needs the photos on this computer.',
  },
]

// /dev: every developer tool, and how the classifier did in the last training run.
export default function DevDashboard({ onLock }) {
  return (
    <>
      <DevTopBar />
      <main className="page dev-dashboard">
        <div className="dev-heading">
          <h1>Developer tools</h1>
          <button type="button" className="button-quiet" onClick={onLock}>
            Lock
          </button>
        </div>
        <ul className="dev-tools">
          {TOOLS.map((tool) => (
            <li key={tool.to}>
              <Link to={tool.to} className="dev-tool">
                <h2>{tool.title}</h2>
                <p>{tool.about}</p>
                {tool.note && <p className="dev-tool-note">{tool.note}</p>}
              </Link>
            </li>
          ))}
        </ul>
        <Results results={smallResults} title="Small model" />
        <Results results={knnResults} title="k-NN, for comparison" />
      </main>
    </>
  )
}

// One training run's results. knn.json has no setting or report, so those
// come from its k and train.py's report.
function Results({ results, title }) {
  const titleId = useId()
  const { heldOut, recordings, passShare } = results
  const setting = results.setting ?? `k = ${results.k}`
  const report = results.report ?? 'training/reports/knn.md'
  const unseen = Object.entries(heldOut.letters)
  const recorded = Object.entries(recordings.letters)
  const passes = (share) => share >= passShare
  return (
    <section className="dev-results" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p className="dev-results-about">
        {results.classifier} ({setting}), trained on {results.trainingHands.toLocaleString()} hands from{' '}
        {results.signers} signers, on {results.date}. The full report is <code>{report}</code>.
      </p>

      <dl className="readouts">
        <Readout label="People it has never seen">{percent(heldOut.mean)}</Readout>
        <Readout label={`Letters at ${percent(passShare)} or more`}>
          {unseen.filter(([, share]) => passes(share)).length} of {unseen.length}
        </Readout>
      </dl>

      <h3>People it has never seen, per letter</h3>
      <ul className="dev-letters">
        {unseen.map(([letter, share]) => (
          <li key={letter} className={passes(share) ? undefined : 'dev-letter-low'}>
            <b>{letter}</b> {percent(share)}
          </li>
        ))}
      </ul>

      <h3>Recorded test set: left hand / right hand, takes right</h3>
      <ul className="dev-letters dev-letters-wide">
        {recorded.map(([letter, r]) => (
          <li key={letter} className={passes(r.left) && passes(r.right) ? undefined : 'dev-letter-low'}>
            <b>{letter}</b> {percent(r.left)} / {percent(r.right)}, {r.takesRight} of {r.takes}
          </li>
        ))}
      </ul>
      <p className="dev-results-about">
        Below the bar of {percent(passShare)} in amber. The bar is still a proposal (docs/project-plan.md).
      </p>
    </section>
  )
}

function Readout({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// Rounded down, so a letter only shows the bar's 90% if it really reached it
// (E at 89.9% shows 89%, not a passing-looking 90% in amber).
const percent = (share) => `${Math.floor(share * 100 + 1e-9)}%`
