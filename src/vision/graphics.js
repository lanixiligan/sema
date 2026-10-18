// Whether WebGL is drawn in software rather than by a graphics card: Chrome
// with hardware acceleration turned off, a computer without graphics drivers,
// or a virtual machine. WebGL still works there, but MediaPipe's GPU mode
// becomes very slow (2 fps in a test on 2026-10-18), while its CPU mode
// stays usable (15 fps on the same machine), so loadHandLandmarker.js picks
// the CPU. `renderer` is the name WebGL reports for what draws it, e.g.
// "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader
// driver)"; empty or unknown names count as a real graphics card.
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|basic render driver/i

export function isSoftwareRenderer(renderer) {
  return typeof renderer === 'string' && SOFTWARE_RENDERERS.test(renderer)
}
