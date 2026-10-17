// The Sema logo (mark and "sema."), in both colours: styles.css shows the one
// made for the background, light or dark. An <img> can't take its colours from
// the page's CSS, hence two files. Width and height give the browser the shape
// before the file loads, so nothing jumps; CSS sets the size it's shown at.
export default function Logo({ className }) {
  return (
    <>
      <img src="/logos/sema-logo-light.svg" alt="Sema" width="598" height="144" className={`${className} logo-light`} />
      <img src="/logos/sema-logo-dark.svg" alt="Sema" width="598" height="144" className={`${className} logo-dark`} />
    </>
  )
}
