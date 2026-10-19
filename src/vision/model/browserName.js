// "Chrome 155", "Firefox 157": the browser and its major version, used to
// label benchmark rows and recorded sessions.
export function browserName() {
  const brands = navigator.userAgentData?.brands ?? []
  const chrome =
    brands.find((b) => b.brand === 'Google Chrome') ||
    brands.find((b) => b.brand === 'Chromium')
  if (chrome) {
    return `${chrome.brand === 'Google Chrome' ? 'Chrome' : 'Chromium'} ${chrome.version}`
  }
  const firefox = navigator.userAgent.match(/Firefox\/(\d+)/)
  return firefox ? `Firefox ${firefox[1]}` : 'Other browser'
}
