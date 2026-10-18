import { describe, expect, it } from 'vitest'
import { isSoftwareRenderer } from './graphics.js'

describe('isSoftwareRenderer', () => {
  it('spots software renderers', () => {
    // Chrome with no graphics card (seen in headless Chrome on 2026-10-18).
    expect(isSoftwareRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)')).toBe(true)
    // Linux without graphics drivers (Mesa).
    expect(isSoftwareRenderer('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true)
    // Windows without graphics drivers.
    expect(isSoftwareRenderer('ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(true)
  })

  it('leaves real graphics cards alone', () => {
    expect(isSoftwareRenderer('ANGLE (NVIDIA, Vulkan 1.4.351 (NVIDIA NVIDIA GeForce GTX 1660 SUPER (0x000021C4)), NVIDIA)')).toBe(false)
    expect(isSoftwareRenderer('ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false)
    expect(isSoftwareRenderer('Apple M1')).toBe(false)
  })

  it('treats an unknown name as a real graphics card', () => {
    expect(isSoftwareRenderer('')).toBe(false)
    expect(isSoftwareRenderer(null)).toBe(false)
    expect(isSoftwareRenderer(undefined)).toBe(false)
  })
})
