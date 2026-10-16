// The "Preview" pill beside the name: Sema is still being built. In the menu,
// a smaller grey "preview" marks the pages that are placeholders for now.
export default function PreviewPill({ inMenu = false }) {
  return inMenu ? <span className="menu-pill">preview</span> : <span className="preview-pill">Preview</span>
}
