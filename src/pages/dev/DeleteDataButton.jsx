import { useSettings } from '../../app/settings/settings.js'

// Delete Sema's data, on the developer dashboard next to Lock (2026-10-29;
// earlier that day a trash icon at the right of the main pages' top bar).
// Clicking it asks, with the browser's own confirm dialog, whether to delete
// everything Sema saved in this browser. App does the deleting (deleteData,
// through SettingsContext) and starts over on Welcome.
const DELETE_QUESTION =
  "Delete everything Sema saved in this browser?\n\nThis removes the settings, any recording session (including takes you haven't downloaded) and this browser's access to the developer pages. Sema will start again from the welcome page."

export default function DeleteDataButton() {
  const { deleteData } = useSettings()

  function confirmDelete() {
    if (window.confirm(DELETE_QUESTION)) deleteData()
  }

  return (
    <button type="button" className="danger-link" onClick={confirmDelete}>
      Delete Sema&rsquo;s data
    </button>
  )
}
