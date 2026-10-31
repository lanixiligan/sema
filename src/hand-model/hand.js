// Interactive 3D hand: the viewer used by the editor, importable on its own.
//
//   import { createHand } from './hand.js';
//   const hand = createHand(document.getElementById('stage'));
//   hand.setPose(poseFromJson);
//
// See README.md ("Using the hand in your own app") for the full API.
//
// Sema's copy of Eidos's src/hand.js (github.com/lanixiligan/eidos, commit
// 9d73763), in Eidos's style. Changed for Sema, 2026-10-31:
// - It draws only while something moves (wake(), and the loop stops itself
//   once the hand has settled), not 60 times a second for ever: a still hand
//   costs no battery, and leaves the graphics card to hand tracking.
// - options.reducedMotion: poses jump into place and a flick doesn't spin on.
// - options.zoom: false turns off scroll-to-zoom, so the page scrolls.
// - spinBy(angle), for the arrow keys.
// - The model sits next to this file (./models/).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { FINGER_NUMBERS, LONG_FINGERS, RELAXED_POSE, WRIST_KEYS, clonePose, normalizePose } from './pose.js';

const DEFAULT_MODEL_URL = new URL('./models/hand-right.glb', import.meta.url).href;

// Initial display angle (yaw only, so spinning stays in the transverse plane)
const DEFAULT_YAW = -0.25;
const BLEND = 0.12; // easing toward the target pose per 60 Hz frame, when no duration is set
// A pose's wrist rotation pivots about the middle of the hand (wrist to
// fingertips), so a hand pointing down stays in the same spot on screen
const PIVOT_Y = 0.9;
const UP = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// Hand finish & dark/light mode
// ---------------------------------------------------------------------------
// One gray finish for both modes: mid gray stands out on a dark backdrop and
// a light one alike
const FINISH = {
  shellColor: 0x8a8a8a,
  roughness: 0.3,
  metalness: 0.2,
  clearcoat: 0.6,
  clearcoatRoughness: 0.15,
};

// Each page mode sets the backdrop; the hand looks the same in both
const MODES = {
  dark: { background: 0x050811 },
  light: { background: 0xe6eaf0 },
};

// Base styles for the canvas and fingertip badges. Injected first in <head> so
// a page's own stylesheet can override them; badge colors read --hand-badge-*.
const BASE_CSS = `
.hand-view { position: relative; overflow: hidden; }
.hand-view > canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
.hand-view.is-dragging > canvas { cursor: grabbing; }
.hand-view.is-panning > canvas { cursor: move; }
.hand-labels { position: absolute; top: 0; left: 0; pointer-events: none; }
.hand-tip-label {
  min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font: 700 11px/1 system-ui, sans-serif; font-variant-numeric: tabular-nums;
  color: var(--hand-badge-text, #ffffff);
  background: var(--hand-badge-bg, #0284c7);
  border: 1px solid var(--hand-badge-border, #38bdf8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  pointer-events: none; user-select: none;
}
.hand-tip-label.is-highlighted {
  background: var(--hand-badge-text, #ffffff);
  color: var(--hand-badge-bg, #0284c7);
  box-shadow: 0 0 0 4px var(--hand-badge-glow, rgba(56, 189, 248, 0.35)), 0 2px 8px rgba(0, 0, 0, 0.25);
}
.hand-view.tips-clickable .hand-tip-label { pointer-events: auto; cursor: pointer; }
`;

function injectBaseStyles() {
  if (document.getElementById('hand-view-styles')) return;
  const style = document.createElement('style');
  style.id = 'hand-view-styles';
  style.textContent = BASE_CSS;
  document.head.prepend(style);
}

// ---------------------------------------------------------------------------
// Procedural studio environment (reflections)
// ---------------------------------------------------------------------------
function createStudioEnvironment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep neutral studio gradient. Every softbox is white too, so the gray
  // hand reflects no tint.
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#222222');
  bgGrad.addColorStop(0.5, '#111111');
  bgGrad.addColorStop(1, '#060606');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Softbox 1: Main top-left bright key light
  const g1 = ctx.createRadialGradient(260, 160, 10, 260, 160, 240);
  g1.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  g1.addColorStop(0.3, 'rgba(245, 245, 245, 0.85)');
  g1.addColorStop(0.7, 'rgba(200, 200, 200, 0.25)');
  g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 550, 400);

  // Softbox 2: Rim light right
  const g2 = ctx.createRadialGradient(820, 240, 15, 820, 240, 260);
  g2.addColorStop(0, 'rgba(230, 230, 230, 0.8)');
  g2.addColorStop(0.5, 'rgba(160, 160, 160, 0.35)');
  g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(520, 40, 504, 450);

  // Softbox 3: Subtle top highlight
  const g3 = ctx.createRadialGradient(512, 80, 5, 512, 80, 160);
  g3.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g3;
  ctx.fillRect(360, 0, 300, 220);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;

  texture.dispose();
  pmremGenerator.dispose();
  return envMap;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------
function createMaterials() {
  return {
    // Physical shell material with sleek clearcoat lacquer
    shell: new THREE.MeshPhysicalMaterial({
      reflectivity: 0.9,
      color: FINISH.shellColor,
      roughness: FINISH.roughness,
      metalness: FINISH.metalness,
      clearcoat: FINISH.clearcoat,
      clearcoatRoughness: FINISH.clearcoatRoughness,
    }),
  };
}

// ---------------------------------------------------------------------------
// Sculpted hand model (WebXR Input Profiles "generic-hand", MIT license)
// ---------------------------------------------------------------------------
// The glTF ships its 25 joints flat under the Armature (XR runtimes pose each
// joint in world space). We re-chain them so local rotations curl a finger.
const FINGER_CHAINS = {
  thumb: ['metacarpal', 'phalanx-proximal', 'phalanx-distal', 'tip'],
  index: ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'],
  middle: ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'],
  ring: ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'],
  pinky: ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'],
};

function boneName(finger, part) {
  return finger === 'thumb' ? `thumb-${part}` : `${finger}-finger-${part}`;
}

// Returns { root, chains: { [finger]: [{ bone, rest }] } }
function buildSculptedHand(gltf, material) {
  const root = gltf.scene;
  root.updateMatrixWorld(true);

  const bones = {};
  root.traverse((o) => {
    if (o.isBone) bones[o.name] = o;
    if (o.isSkinnedMesh) {
      o.material = material;
      o.frustumCulled = false;
    }
  });

  // Re-parent joints into chains; attach() preserves world transforms so the
  // skin's bind pose is unchanged.
  const wrist = bones['wrist'];
  const chains = {};
  Object.entries(FINGER_CHAINS).forEach(([finger, parts]) => {
    let parent = wrist;
    chains[finger] = parts.map((part) => {
      const bone = bones[boneName(finger, part)];
      parent.attach(bone);
      parent = bone;
      return { bone, rest: bone.quaternion.clone() };
    });
  });
  root.updateMatrixWorld(true);

  // Orient: fingers along +Y, back of hand (joint +Y per WebXR spec) to -Z.
  const wristPos = wrist.getWorldPosition(new THREE.Vector3());
  const knucklePos = bones['middle-finger-phalanx-proximal'].getWorldPosition(new THREE.Vector3());
  const tipPos = bones['middle-finger-tip'].getWorldPosition(new THREE.Vector3());
  const fingerDir = knucklePos.clone().sub(wristPos).normalize();
  const dorsal = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(wrist.getWorldQuaternion(new THREE.Quaternion()));
  dorsal.addScaledVector(fingerDir, -dorsal.dot(fingerDir)).normalize();
  const side = new THREE.Vector3().crossVectors(fingerDir, dorsal);

  const src = new THREE.Matrix4().makeBasis(side, fingerDir, dorsal);
  const dst = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, -1)
  );
  const align = dst.multiply(src.transpose());
  root.quaternion.setFromRotationMatrix(align);

  // Scale to the stage (wrist to middle fingertip ~3.4 units)
  const scale = 3.4 / tipPos.distanceTo(wristPos);
  root.scale.setScalar(scale);

  // Seat the wrist at the base of the stage
  const seatedWrist = wristPos.clone().applyMatrix4(align).multiplyScalar(scale);
  root.position.set(0, -0.72, 0).sub(seatedWrist);

  return { root, chains };
}

// Joint-local axes (WebXR): -Z runs toward the fingertip, +Y is the back of
// the hand, so flexion toward the palm is a negative rotation about X.
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const qCurl = new THREE.Quaternion();
const qSpread = new THREE.Quaternion();
const qRoll = new THREE.Quaternion();
const restSpread = RELAXED_POSE.spread;
// Pose rotate (+) turns the thumb's pad toward the fingers and the other
// fingers' pads toward the thumb; both are a negative joint-local Z roll
const ROLL_SIGN = -1;

// roll turns the bone about its own length (joint-local Z)
function setJoint(joint, curl, spread = 0, roll = 0) {
  qSpread.setFromAxisAngle(AXIS_Y, spread);
  qCurl.setFromAxisAngle(AXIS_X, -curl);
  qRoll.setFromAxisAngle(AXIS_Z, roll);
  joint.bone.quaternion.copy(joint.rest).multiply(qSpread).multiply(qCurl).multiply(qRoll);
}

function poseSculptedHand(chains, state) {
  LONG_FINGERS.forEach((key) => {
    // chain: [metacarpal, proximal, intermediate, distal, tip]
    const chain = chains[key];
    const curls = state[key];
    // The sculpted rest pose already has natural splay, so apply the delta.
    // Display-space spread (+ = toward pinky side) is -Y in joint space.
    const spread = -(state.spread[key] - restSpread[key]);
    setJoint(chain[1], curls[0], spread, ROLL_SIGN * state.rotate[key]);
    setJoint(chain[2], curls[1]);
    setJoint(chain[3], curls[2]);
  });

  // chain: [metacarpal, proximal, distal, tip]
  const t = chains.thumb;
  const [t0, t1] = state.thumb;
  // Swing (+) carries the thumb across the palm toward the pinky; rotate (+)
  // turns the whole thumb about its length so the pad faces the fingers
  setJoint(t[0], t0 * 0.35, -t0 * 0.35 - state.spread.thumb, ROLL_SIGN * state.rotate.thumb);
  setJoint(t[1], t0 * 0.6);
  setJoint(t[2], t1);
}

// ---------------------------------------------------------------------------
// createHand
// ---------------------------------------------------------------------------
/**
 * Render an interactive hand into `container` (sized by its CSS).
 *
 * @param {HTMLElement} container
 * @param {object} [options]
 * @param {'dark'|'light'} [options.mode='dark'] backdrop (the hand is gray in both)
 * @param {'right'|'left'} [options.side='right'] drawn as its mirror image
 * @param {boolean} [options.numbers=true] fingertip number badges
 * @param {boolean} [options.background=true] false for a transparent canvas
 * @param {boolean} [options.controls=true] drag to spin, middle-drag to move, scroll to zoom
 * @param {boolean} [options.zoom=true] scroll to zoom (with controls)
 * @param {boolean} [options.reducedMotion=false] poses jump, flicks don't spin on
 * @param {object} [options.pose] initial pose (defaults to relaxed)
 * @param {string} [options.modelUrl] sculpted glTF, defaults to ../models/hand-right.glb
 * @param {(finger: string) => void} [options.onTipClick] fingertip badge clicked
 *   (badges only take clicks while setTipsClickable(true))
 */
export function createHand(container, options = {}) {
  const {
    mode: initialMode = 'dark',
    side: initialSide = 'right',
    numbers = true,
    background = true,
    controls = true,
    zoom = true,
    reducedMotion = false,
    pose: initialPose = RELAXED_POSE,
    modelUrl = DEFAULT_MODEL_URL,
    onTipClick = null,
  } = options;

  injectBaseStyles();
  container.classList.add('hand-view');

  const size = () => ({
    width: Math.max(1, container.clientWidth),
    height: Math.max(1, container.clientHeight),
  });
  const { width, height } = size();

  // --- Scene, camera, renderers ---
  const scene = new THREE.Scene();
  if (background) {
    scene.background = new THREE.Color();
    scene.fog = new THREE.FogExp2(0x050811, 0.03);
  }

  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
  camera.position.set(0, 0, 7.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !background });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.append(renderer.domElement);

  // HTML overlay for fingertip number badges, drawn over the WebGL canvas
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.className = 'hand-labels';
  container.append(labelRenderer.domElement);

  const studioEnv = createStudioEnvironment(renderer);
  scene.environment = studioEnv;

  // --- Lighting ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Key directional light
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(5, 7, 6);
  scene.add(keyLight);

  // Rim light from behind, to pick out the hand's edge
  const rimLight = new THREE.DirectionalLight(0xffffff, 2.4);
  rimLight.position.set(-8, 3, -4);
  scene.add(rimLight);

  // Fill light, neutral so the gray stays gray
  const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
  fillLight.position.set(6, -4, -3);
  scene.add(fillLight);

  // --- Hands ---
  const mats = createMaterials();
  const handRoot = new THREE.Group();
  handRoot.position.y = -0.15;
  handRoot.rotation.set(0, DEFAULT_YAW, 0);
  scene.add(handRoot);

  // handRoot (view spin, zoom, mirroring) > wristPivot (pose rotation) > hand
  const wristPivot = new THREE.Group();
  wristPivot.position.y = PIVOT_Y;
  wristPivot.rotation.order = 'ZXY'; // twist about the forearm, then tilt, then turn
  handRoot.add(wristPivot);
  const handContent = new THREE.Group();
  handContent.position.y = -PIVOT_Y;
  wristPivot.add(handContent);

  let sculpted = null; // { root, chains } once the glTF loads

  // Fingertip number badges
  const tipLabels = [];

  function addTipLabel(parent, finger, position) {
    const el = document.createElement('div');
    el.className = 'hand-tip-label';
    el.dataset.finger = finger;
    el.textContent = FINGER_NUMBERS[finger];
    el.setAttribute('aria-label', `${finger} finger`);
    const label = new CSS2DObject(el);
    label.position.copy(position);
    label.visible = numbersVisible;
    parent.add(label);
    tipLabels.push(label);
  }

  let numbersVisible = numbers;

  labelRenderer.domElement.addEventListener('click', (e) => {
    const tip = e.target.closest('.hand-tip-label');
    if (tip && onTipClick) onTipClick(tip.dataset.finger);
  });

  // --- State ---
  let mode = MODES[initialMode] ? initialMode : 'dark';
  let side = 'left'; // the rig as built; setSide(initialSide) below mirrors it for 'right'
  let target = normalizePose(initialPose);
  const state = clonePose(target);
  // A timed move to the target: { from, start, duration } while it runs
  let tween = null;
  let lastFrame = 0;
  let running = false; // whether the animation loop is on (wake, sleep)

  // Spin, pan & zoom: dragging spins the hand about the vertical axis (so it
  // stays in the transverse plane and keeps whatever angle it is left at),
  // middle-drag slides it across the screen, and scroll changes depth.
  let drag = null; // 'spin' | 'pan' while a button is held
  let prevX = 0;
  let prevY = 0;
  let spinVelocity = 0;
  const homeY = handRoot.position.y;
  let targetX = 0;
  let targetY = homeY;
  let targetZ = 0;
  // Orientation the hand eases back to after resetView() (null when idle)
  let resetTarget = null;

  const ready = new Promise((resolve) => {
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        sculpted = buildSculptedHand(gltf, mats.shell);
        Object.entries(sculpted.chains).forEach(([finger, chain]) => {
          // Number badge ~1 cm past the tip joint (joint -Z points out of the finger)
          addTipLabel(chain.at(-1).bone, finger, new THREE.Vector3(0, 0, -0.012));
        });
        handContent.add(sculpted.root);
        wake();
        resolve(true);
      },
      undefined,
      (err) => {
        console.warn('Hand model failed to load.', err);
        resolve(false);
      }
    );
  });

  function setMode(next) {
    if (!MODES[next]) throw new Error(`unknown mode "${next}"`);
    mode = next;
    const m = MODES[mode];
    if (background) {
      scene.background.setHex(m.background);
      scene.fog.color.setHex(m.background);
    }
    wake();
  }

  // Each hand is drawn as its mirror image, the way you see it when copying a
  // signer who faces you. The rig is a right hand, so the right hand is
  // handRoot mirrored across its local X axis and the left hand is the rig
  // as is. Every pose is mirrored with it, so poses need no left version.
  function setSide(next) {
    if (next !== 'left' && next !== 'right') throw new Error(`unknown side "${next}"`);
    if (next !== side) {
      // Mirror the current orientation too (M·R·M), so the hand flips in place
      const q = handRoot.quaternion;
      q.set(q.x, -q.y, -q.z, q.w);
      if (resetTarget) resetTarget.set(resetTarget.x, -resetTarget.y, -resetTarget.z, resetTarget.w);
      handRoot.scale.x = next === 'right' ? -1 : 1;
      side = next;
    }
    wake();
  }

  setMode(mode);
  setSide(initialSide);

  // --- Spin & zoom controls ---
  const qSpin = new THREE.Quaternion();

  function spinHand(angle) {
    qSpin.setFromAxisAngle(UP, angle);
    handRoot.quaternion.premultiply(qSpin);
  }

  const canvas = renderer.domElement;

  function onPointerDown(e) {
    if (drag || (e.button !== 0 && e.button !== 1)) return;
    if (e.button === 1) e.preventDefault(); // no browser autoscroll
    drag = e.button === 1 ? 'pan' : 'spin';
    container.classList.add(drag === 'pan' ? 'is-panning' : 'is-dragging');
    canvas.setPointerCapture(e.pointerId);
    prevX = e.clientX;
    prevY = e.clientY;
    spinVelocity = 0;
    resetTarget = null; // grabbing the hand cancels an in-progress reset
    wake();
  }

  function onPointerMove(e) {
    if (!drag) return;
    if (drag === 'pan') {
      // World units per screen pixel at the hand's depth, so it tracks the cursor
      const dist = camera.position.z - handRoot.position.z;
      const perPixel = (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / size().height;
      targetX = handRoot.position.x += (e.clientX - prevX) * perPixel;
      targetY = handRoot.position.y -= (e.clientY - prevY) * perPixel;
    } else {
      spinVelocity = (e.clientX - prevX) * 0.007;
      spinHand(spinVelocity);
    }
    prevX = e.clientX;
    prevY = e.clientY;
    wake();
  }

  function onPointerUp() {
    drag = null;
    if (reducedMotion) spinVelocity = 0;
    container.classList.remove('is-dragging', 'is-panning');
  }

  function onWheel(e) {
    targetZ = Math.max(-4.0, Math.min(3.0, targetZ - e.deltaY * 0.003));
    wake();
  }

  if (controls) {
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    if (zoom) container.addEventListener('wheel', onWheel, { passive: true });
  }

  const resizeObserver = new ResizeObserver(() => {
    const { width: w, height: h } = size();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    wake();
  });
  resizeObserver.observe(container);

  // --- Animation loop ---
  // Set every angle `amount` of the way from `from` to the target
  function blendPose(from, amount) {
    const mix = (a, b) => a + (b - a) * amount;
    LONG_FINGERS.forEach((key) => {
      for (let i = 0; i < 3; i++) state[key][i] = mix(from[key][i], target[key][i]);
    });
    for (let i = 0; i < 2; i++) state.thumb[i] = mix(from.thumb[i], target.thumb[i]);
    Object.keys(state.spread).forEach((key) => {
      state.spread[key] = mix(from.spread[key], target.spread[key]);
    });
    Object.keys(state.rotate).forEach((key) => {
      state.rotate[key] = mix(from.rotate[key], target.rotate[key]);
    });
    WRIST_KEYS.forEach((key) => {
      state.wrist[key] = mix(from.wrist[key], target.wrist[key]);
    });
  }

  const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

  // A timed move follows an ease-in-out curve and lands exactly on time;
  // otherwise the hand closes in on the target at the same speed at any frame rate
  function stepPose(now) {
    const dt = Math.min(100, lastFrame ? now - lastFrame : 1000 / 60);
    lastFrame = now;
    if (tween) {
      // A frame's timestamp can be a little older than the setPose() call
      const t = Math.min(1, Math.max(0, (now - tween.start) / tween.duration));
      blendPose(tween.from, easeInOut(t));
      if (t === 1) tween = null;
    } else {
      blendPose(state, 1 - (1 - BLEND) ** (dt / (1000 / 60)));
    }
  }

  function render(now) {
    // Reset easing, else flick momentum
    if (drag !== 'spin') {
      if (resetTarget) {
        handRoot.quaternion.slerp(resetTarget, 0.12);
        if (handRoot.quaternion.angleTo(resetTarget) < 0.001) {
          handRoot.quaternion.copy(resetTarget);
          resetTarget = null;
        }
      } else if (Math.abs(spinVelocity) > 0.0007) {
        spinHand(spinVelocity);
        spinVelocity *= 0.95;
      }
    }

    // Smooth depth (zoom) and, after resetView(), position interpolation
    handRoot.position.z += (targetZ - handRoot.position.z) * 0.08;
    if (drag !== 'pan') {
      handRoot.position.x += (targetX - handRoot.position.x) * 0.12;
      handRoot.position.y += (targetY - handRoot.position.y) * 0.12;
    }

    stepPose(now);
    // turn: about Z (+ fingers toward the pinky side), tilt: about X (+ toward
    // the palm, which faces +Z), twist: about Y (+ palm toward the thumb, +X)
    wristPivot.rotation.set(state.wrist.tilt, state.wrist.twist, state.wrist.turn);
    if (sculpted) poseSculptedHand(sculpted.chains, state);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    if (settled()) sleep();
  }

  // --- Drawing only while something moves ---
  // The loop runs from wake() until the hand has settled: no drag, spin,
  // reset, timed move or easing left. Then it stops until the next change.

  function wake() {
    if (running) return;
    running = true;
    lastFrame = 0; // the first frame after a pause steps like a normal one
    renderer.setAnimationLoop(render);
  }

  function sleep() {
    running = false;
    renderer.setAnimationLoop(null);
  }

  // Easing only ever gets close, so whatever is close enough is snapped into
  // place: the last frame drawn is exactly the target.
  function settled() {
    if (drag || resetTarget || tween || Math.abs(spinVelocity) > 0.0007) return false;
    const near = (a, b) => Math.abs(a - b) < 0.001;
    const p = handRoot.position;
    if (!near(p.x, targetX) || !near(p.y, targetY) || !near(p.z, targetZ)) return false;
    if (!poseReached()) return false;
    p.set(targetX, targetY, targetZ);
    Object.assign(state, clonePose(target));
    return true;
  }

  function poseReached() {
    const near = (a, b) => Math.abs(a - b) < 0.0005;
    for (const key of LONG_FINGERS) {
      if (!state[key].every((v, i) => near(v, target[key][i]))) return false;
    }
    if (!state.thumb.every((v, i) => near(v, target.thumb[i]))) return false;
    for (const group of ['spread', 'rotate', 'wrist']) {
      for (const key of Object.keys(target[group])) {
        if (!near(state[group][key], target[group][key])) return false;
      }
    }
    return true;
  }

  wake();

  // --- Public API ---
  return {
    element: container,
    /** Resolves true once the sculpted model has loaded, false if it failed to load. */
    ready,
    /**
     * Ease to a pose (validated; throws on bad data). `duration` (ms) makes it
     * a timed move that arrives exactly then; `instant` jumps straight there.
     */
    setPose(pose, { instant = false, duration = 0 } = {}) {
      target = normalizePose(pose);
      tween = null;
      if (instant || reducedMotion) Object.assign(state, clonePose(target));
      else if (duration > 0) tween = { from: clonePose(state), start: performance.now(), duration };
      wake();
    },
    /** Turn the hand about the vertical axis by `angle` radians (arrow keys). */
    spinBy(angle) {
      spinHand(angle);
      wake();
    },
    /** The pose the hand is moving to. */
    getPose: () => clonePose(target),
    setMode,
    getMode: () => mode,
    setSide,
    getSide: () => side,
    setNumbersVisible(on) {
      numbersVisible = on;
      tipLabels.forEach((label) => (label.visible = on));
      wake();
    },
    getNumbersVisible: () => numbersVisible,
    /** Accent one finger's badge, e.g. to link it to a control. */
    highlightFinger(finger, on = true) {
      tipLabels.forEach((label) => {
        if (label.element.dataset.finger === finger) label.element.classList.toggle('is-highlighted', on);
      });
    },
    /** Let fingertip badges take clicks (reported through options.onTipClick). */
    setTipsClickable(on) {
      container.classList.toggle('tips-clickable', on);
    },
    /** Ease back to the starting angle (mirrored with the hand), position and zoom. */
    resetView() {
      spinVelocity = 0;
      targetX = 0;
      targetY = homeY;
      targetZ = 0;
      const yaw = side === 'right' ? -DEFAULT_YAW : DEFAULT_YAW;
      resetTarget = new THREE.Quaternion().setFromAxisAngle(UP, yaw);
      if (reducedMotion) {
        handRoot.quaternion.copy(resetTarget);
        handRoot.position.set(targetX, targetY, targetZ);
        resetTarget = null;
      }
      wake();
    },
    dispose() {
      sleep();
      resizeObserver.disconnect();
      container.removeEventListener('wheel', onWheel);
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
      container.classList.remove('hand-view', 'is-dragging', 'is-panning', 'tips-clickable');
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
      studioEnv.dispose();
      renderer.dispose();
    },
  };
}
