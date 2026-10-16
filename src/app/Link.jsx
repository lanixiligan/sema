import { navigate } from './navigation.js'

// A normal link (<a href>) that changes pages without reloading the browser tab.
// Ctrl-, Cmd-, Shift- and middle-clicks are left to the browser, so "open in a
// new tab" still works.
export default function Link({ to, ...props }) {
  function handleClick(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={handleClick} {...props} />
}
