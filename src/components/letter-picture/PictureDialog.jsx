import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../icons/icons.jsx'

// A large window over the page for a letter's picture (LetterPicture's expand
// button): the browser's own <dialog>, opened with showModal(). That gives, for
// free, what a window needs: the rest of the page can't be reached while it's
// open, Esc closes it, Tab stays inside it, and focus goes back to the button
// that opened it. The page behind keeps running, so the camera and the hold
// timer aren't interrupted. It's only in the page while open (the caller
// renders it then), so a closed one costs nothing, such as a second 3D canvas.
// It's put straight into <body> (a portal), so the CSS of the page that opened
// it, such as Learn's card sizes, doesn't reach it; its context still does.
export default function PictureDialog({ title, onClose, children }) {
  const dialogRef = useRef(null)

  // StrictMode mounts twice in development, and showModal() on a dialog that's
  // already open throws, so it checks first.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      className="picture-dialog"
      aria-label={title}
      onClose={onClose}
      // A click on the dark backdrop lands on the dialog itself, not on what's
      // inside it.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button type="button" className="picture-dialog-close" aria-label="Close" onClick={onClose}>
        <CloseIcon size={14} />
      </button>
      {children}
    </dialog>,
    document.body,
  )
}
