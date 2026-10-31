// Copied unchanged from Eidos (github.com/lanixiligan/eidos, src/pose.js,
// commit 9d73763). It's the pose format both apps share: keep
// it identical to Eidos's, so a file made there works here. Eidos's style
// (semicolons) is kept on purpose.

// Hand pose format shared by the editor and Sema. See docs/POSE_FORMAT.md.
//
// A pose is { pinky, ring, middle, index: [base, middle, tip], thumb: [bend, tip],
// spread: { index, middle, ring, pinky, thumb },
// rotate: { thumb, index, middle, ring, pinky }, wrist: { turn, tilt, twist } }
// in radians. Poses describe a right hand; a left hand shows the same pose
// mirrored.

export const POSE_VERSION = 1;

export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];
export const LONG_FINGERS = ['pinky', 'ring', 'middle', 'index'];
// Whole-hand rotation: turn (in the palm's plane, π points the fingers down),
// tilt (fingers toward the palm side), twist (palm toward the thumb side)
export const WRIST_KEYS = ['turn', 'tilt', 'twist'];

// Fingertip numbering: 1 thumb, 2 index, 3 middle, 4 ring, 5 pinky
export const FINGER_NUMBERS = { thumb: 1, index: 2, middle: 3, ring: 4, pinky: 5 };

export function clonePose(pose) {
  return JSON.parse(JSON.stringify(pose));
}

// Validate pose data (e.g. parsed JSON) and return a clean copy. Throws an
// Error naming the first bad field. `version` may be omitted (older files).
export function normalizePose(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('a pose must be a JSON object');
  }
  if (data.version !== undefined && data.version !== POSE_VERSION) {
    throw new Error(`unsupported pose version ${JSON.stringify(data.version)} (expected ${POSE_VERSION})`);
  }
  const angle = (v, what) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${what} must be a number`);
    return v;
  };
  const pose = { spread: {} };
  LONG_FINGERS.forEach((finger) => {
    if (!Array.isArray(data[finger]) || data[finger].length < 3) {
      throw new Error(`"${finger}" must be [base, middle, tip]`);
    }
    pose[finger] = data[finger].slice(0, 3).map((v, i) => angle(v, `${finger}[${i}]`));
    pose.spread[finger] = angle(data.spread?.[finger], `spread.${finger}`);
  });
  if (!Array.isArray(data.thumb) || data.thumb.length < 2) {
    throw new Error('"thumb" must be [bend, tip]');
  }
  pose.thumb = data.thumb.slice(0, 2).map((v, i) => angle(v, `thumb[${i}]`));
  pose.spread.thumb = data.spread?.thumb === undefined ? 0 : angle(data.spread.thumb, 'spread.thumb');
  if (data.rotate !== undefined && (data.rotate === null || typeof data.rotate !== 'object')) {
    throw new Error('"rotate" must be { thumb, index, middle, ring, pinky }');
  }
  // Each finger's rotation about its own length (+ turns the thumb's pad
  // toward the fingers and the other fingers' pads toward the thumb)
  pose.rotate = {};
  FINGERS.forEach((finger) => {
    pose.rotate[finger] = data.rotate?.[finger] === undefined ? 0 : angle(data.rotate[finger], `rotate.${finger}`);
  });
  if (data.wrist !== undefined && (data.wrist === null || typeof data.wrist !== 'object')) {
    throw new Error('"wrist" must be { turn, tilt, twist }');
  }
  pose.wrist = {};
  WRIST_KEYS.forEach((key) => {
    pose.wrist[key] = data.wrist?.[key] === undefined ? 0 : angle(data.wrist[key], `wrist.${key}`);
  });
  return pose;
}

// The JSON written to files: versioned, fields in a fixed order, angles
// rounded to 3 decimals (well under a tenth of a degree).
export function serializePose(pose) {
  const p = normalizePose(pose);
  const round = (v) => Math.round(v * 1000) / 1000;
  const out = { version: POSE_VERSION };
  LONG_FINGERS.forEach((finger) => (out[finger] = p[finger].map(round)));
  out.thumb = p.thumb.map(round);
  out.spread = {};
  ['index', 'middle', 'ring', 'pinky', 'thumb'].forEach((key) => (out.spread[key] = round(p.spread[key])));
  out.rotate = {};
  FINGERS.forEach((finger) => (out.rotate[finger] = round(p.rotate[finger])));
  out.wrist = {};
  WRIST_KEYS.forEach((key) => (out.wrist[key] = round(p.wrist[key])));
  return JSON.stringify(out, null, 2) + '\n';
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
