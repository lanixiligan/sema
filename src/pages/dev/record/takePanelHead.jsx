import { EXPECTED_SAMPLES } from '../../../recorder/takeRules.js'

// What Record's camera panel header shows (CameraPanel's props): the take's
// phase, or what Sema sees (idleText) while no take runs or a take waits for
// the hand; "18 / 30 frames" on the right while capturing; and along its
// bottom edge a line that fills as the take is captured.
export function takePanelHead(recording, idleText) {
  if (recording.phase !== 'capturing') return { status: phaseText(recording) ?? idleText }
  const frames = `${recording.kept ?? 0} / ${EXPECTED_SAMPLES} frames`
  return {
    status: phaseText(recording),
    extra: <span className="record-panel-frames">{frames}</span>,
    fill: { share: recording.progress ?? 0, label: 'Capturing take', text: frames },
  }
}

function phaseText(recording) {
  switch (recording.phase) {
    case 'countdown':
      return `Get ready… ${recording.secondsLeft}`
    case 'waiting':
      return null // the header shows idleText: what Sema is waiting for
    case 'settling':
    case 'capturing':
      return 'Hold…'
    case 'saving':
      return 'Saving…'
    default:
      return null
  }
}
