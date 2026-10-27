import { isUnlocked } from './devAccess.js'
import DevDashboard from './DevDashboard.jsx'
import DevGate from './DevGate.jsx'
import ExtractPage from './extract/ExtractPage.jsx'
import RecordPage from './record/RecordPage.jsx'
import TrackingPage from './tracking/TrackingPage.jsx'

// Every developer page, behind the access code (devAccess.js). App.jsx loads
// this file only when a developer page is opened, so other visitors never
// download the tools' code. `page` is the router's name for the page,
// `signingHand` the saved setting (Record's first take is for it),
// `devModel` the classifier Learn runs and onModelChange saves a new one
// (the dashboard's switch), `devAccess` the fingerprint saved in this browser (progressStore.js), and
// onAccessChange saves a new one (null locks the pages again).
export default function DevArea({ page, signingHand, devModel, onModelChange, devAccess, onAccessChange }) {
  if (!isUnlocked(devAccess)) return <DevGate onUnlock={onAccessChange} />
  switch (page) {
    case 'dev':
      return <DevDashboard model={devModel} onModelChange={onModelChange} onLock={() => onAccessChange(null)} />
    case 'devTracking':
      return <TrackingPage />
    case 'devExtract':
      return <ExtractPage />
    case 'devRecord':
      return <RecordPage signingHand={signingHand} />
  }
}
