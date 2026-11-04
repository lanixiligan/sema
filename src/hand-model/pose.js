// Copied unchanged from Eidos (github.com/lanixiligan/eidos, src/pose.js,
// commit 9d73763 plus its `move` and `motion` fields, 2026-11-04). It's the
// pose format both apps share: keep it identical to Eidos's, so a file made
// there works here. Eidos's style (semicolons) is kept on purpose.

// Hand pose format shared by the editor and Sema. See docs/POSE_FORMAT.md.
//
// A pose is { pinky, ring, middle, index: [base, middle, tip], thumb: [bend, tip],
// spread: { index, middle, ring, pinky, thumb },
// rotate: { thumb, index, middle, ring, pinky }, wrist: { turn, tilt, twist },
// move: { side, up, forward } } in radians (move in hand lengths), plus an
// optional `motion`: the later steps of a movement, [{ duration, pose }].
// Poses describe a right hand; a left hand shows the same pose mirrored.

export const POSE_VERSION = 1;

export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];
export const LONG_FINGERS = ['pinky', 'ring', 'middle', 'index'];
// Whole-hand rotation: turn (in the palm's plane, π points the fingers down),
// tilt (fingers toward the palm side), twist (palm toward the thumb side)
export const WRIST_KEYS = ['turn', 'tilt', 'twist'];
// Whole-hand position, in hand lengths (wrist to middle fingertip): side (+
// out, away from the body's middle), up, forward (+ toward the viewer)
export const MOVE_KEYS = ['side', 'up', 'forward'];

// Fingertip numbering: 1 thumb, 2 index, 3 middle, 4 ring, 5 pinky
export const FINGER_NUMBERS = { thumb: 1, index: 2, middle: 3, ring: 4, pinky: 5 };

export function clonePose(pose) {
  return JSON.parse(JSON.stringify(pose));
}

// Validate pose data (e.g. parsed JSON) and return a clean copy. Throws an
// Error naming the first bad field. `version` may be omitted (older files).
export function normalizePose(data) {
  if (data !== null && typeof data === 'object' && data.version !== undefined && data.version !== POSE_VERSION) {
    throw new Error(`unsupported pose version ${JSON.stringify(data.version)} (expected ${POSE_VERSION})`);
  }
  const pose = readStill(data, '');
  if (data.motion !== undefined) {
    if (!Array.isArray(data.motion)) throw new Error('"motion" must be a list of steps');
    // Each later step: the time it takes to move there from the step before
    // (ms), and the whole hand at that step
    const steps = data.motion.map((step, i) => {
      const at = `motion[${i}]`;
      if (step === null || typeof step !== 'object' || Array.isArray(step)) throw new Error(`${at} must be { duration, pose }`);
      const { duration } = step;
      if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
        throw new Error(`${at}.duration must be a number of milliseconds above 0`);
      }
      return { duration, pose: readStill(step.pose, `${at}.pose.`) };
    });
    // No later steps is a still pose
    if (steps.length) pose.motion = steps;
  }
  return pose;
}

// One hand shape and placement, without motion. `at` prefixes field names in
// errors ("motion[0].pose.").
function readStill(data, at) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(at ? `${at.slice(0, -1)} must be a pose object` : 'a pose must be a JSON object');
  }
  const angle = (v, what) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${at}${what} must be a number`);
    return v;
  };
  const optional = (v, what) => (v === undefined ? 0 : angle(v, what));
  const group = (key, keys) => {
    if (data[key] !== undefined && (data[key] === null || typeof data[key] !== 'object')) {
      throw new Error(`"${at}${key}" must be { ${keys.join(', ')} }`);
    }
  };
  const pose = { spread: {} };
  LONG_FINGERS.forEach((finger) => {
    if (!Array.isArray(data[finger]) || data[finger].length < 3) {
      throw new Error(`"${at}${finger}" must be [base, middle, tip]`);
    }
    pose[finger] = data[finger].slice(0, 3).map((v, i) => angle(v, `${finger}[${i}]`));
    pose.spread[finger] = angle(data.spread?.[finger], `spread.${finger}`);
  });
  if (!Array.isArray(data.thumb) || data.thumb.length < 2) {
    throw new Error(`"${at}thumb" must be [bend, tip]`);
  }
  pose.thumb = data.thumb.slice(0, 2).map((v, i) => angle(v, `thumb[${i}]`));
  pose.spread.thumb = optional(data.spread?.thumb, 'spread.thumb');
  // Each finger's rotation about its own length (+ turns the thumb's pad
  // toward the fingers and the other fingers' pads toward the thumb)
  group('rotate', FINGERS);
  pose.rotate = {};
  FINGERS.forEach((finger) => (pose.rotate[finger] = optional(data.rotate?.[finger], `rotate.${finger}`)));
  group('wrist', WRIST_KEYS);
  pose.wrist = {};
  WRIST_KEYS.forEach((key) => (pose.wrist[key] = optional(data.wrist?.[key], `wrist.${key}`)));
  // Where the whole hand is, in hand lengths from its resting place
  group('move', MOVE_KEYS);
  pose.move = {};
  MOVE_KEYS.forEach((key) => (pose.move[key] = optional(data.move?.[key], `move.${key}`)));
  return pose;
}

// The pose without its motion: the hand at the first step
export function stillPose(pose) {
  const still = clonePose(pose);
  delete still.motion;
  return still;
}

// Every step of a pose's movement in order, each { duration, pose }: the
// first is the pose itself (duration 0), a still pose has only that one
export function motionSteps(pose) {
  return [{ duration: 0, pose: stillPose(pose) }, ...clonePose(pose.motion ?? [])];
}

// The JSON written to files: versioned, fields in a fixed order, angles and
// distances rounded to 3 decimals (well under a tenth of a degree) and
// durations to whole milliseconds.
export function serializePose(pose) {
  const p = normalizePose(pose);
  const out = { version: POSE_VERSION, ...writeStill(p) };
  if (p.motion) out.motion = p.motion.map(({ duration, pose: step }) => ({ duration: Math.round(duration), pose: writeStill(step) }));
  return JSON.stringify(out, null, 2) + '\n';
}

function writeStill(p) {
  const round = (v) => Math.round(v * 1000) / 1000;
  const out = {};
  LONG_FINGERS.forEach((finger) => (out[finger] = p[finger].map(round)));
  out.thumb = p.thumb.map(round);
  out.spread = {};
  ['index', 'middle', 'ring', 'pinky', 'thumb'].forEach((key) => (out.spread[key] = round(p.spread[key])));
  out.rotate = {};
  FINGERS.forEach((finger) => (out.rotate[finger] = round(p.rotate[finger])));
  out.wrist = {};
  WRIST_KEYS.forEach((key) => (out.wrist[key] = round(p.wrist[key])));
  out.move = {};
  MOVE_KEYS.forEach((key) => (out.move[key] = round(p.move[key])));
  return out;
}

// The hand at rest: the pose a hand starts in, and the finger spread the
// sculpted model is built with (hand.js spreads fingers relative to it)
export const RELAXED_POSE = normalizePose({
  pinky: [0.25, 0.35, 0.25],
  ring: [0.2, 0.3, 0.2],
  middle: [0.15, 0.25, 0.18],
  index: [0.12, 0.2, 0.15],
  thumb: [0.2, 0.15],
  spread: { index: -0.1, middle: -0.03, ring: 0.04, pinky: 0.12, thumb: 0 },
});
